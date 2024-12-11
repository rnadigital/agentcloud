'use strict';

import { createAdapter } from '@socket.io/redis-adapter';
import debug from 'debug';
import { client } from 'lib/redis/redis';
import { Server } from 'socket.io';
const log = debug('webapp:socket');
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config({ path: '.env' });

import checkSession from '@mw/auth/checksession';
import fetchSession from '@mw/auth/fetchsession';
import useJWT from '@mw/auth/usejwt';
import useSession from '@mw/auth/usesession';
import { timingSafeEqual } from 'crypto';
import { unsafeGetAppById } from 'db/app';
import { ChatChunk, upsertOrUpdateChatMessage } from 'db/chat';
import {
	checkCanAccessApp,
	getSessionById,
	setSessionStatus,
	unsafeGetSessionById,
	unsafeSetSessionStatus,
	unsafeSetSessionUpdatedDate
} from 'db/session';
import { SessionStatus } from 'struct/session';

import { SharingMode } from './lib/struct/sharing';

export const io = new Server();

//TODO: move this state into redis once we expand webapp beyond 1 pod
export let activeSessionRooms = [];
export function updateActiveSessionRooms() {
	activeSessionRooms = [...io.sockets.adapter.rooms]
		.filter(re => !re[1].has(re[0]))
		.map(re => re[0])
		.filter(room => room.startsWith('_'));
}

export function initSocket(rawHttpServer) {
	io.attach(rawHttpServer);
	const pubClient = client.duplicate();
	const subClient = client.duplicate();

	io.adapter(createAdapter(pubClient, subClient));

	io.use((socket, next) => {
		if (!socket.request['locals']) {
			socket.request['locals'] = {};
		}
		const backendToken = socket.request.headers['x-agent-backend-socket-token'] || '';
		log('socket.id %O backendToken %O', socket.id, backendToken);
		socket.request['locals'].isAgentBackend =
			backendToken.length === process.env.AGENT_BACKEND_SOCKET_TOKEN.length &&
			timingSafeEqual(
				Buffer.from(socket.request.headers['x-agent-backend-socket-token'] as String),
				Buffer.from(process.env.AGENT_BACKEND_SOCKET_TOKEN)
			);
		socket.request['locals'].isSocket = true;
		socket.request['locals'].socket = socket;
		// log('socket locals %O', socket.request['locals']);
		next();
	});
	io.use((socket, next) => {
		useSession(socket.request, socket.request, next);
	});
	io.use((socket, next) => {
		useJWT(socket.request, socket.request, next);
	});
	io.use((socket, next) => {
		fetchSession(socket.request, socket.request, next);
	});
	// io.use((socket, next) => {
	// 	checkSession(socket.request, socket.request, next);
	// });

	io.on('connection', async socket => {
		log('socket.id "%s" connected', socket.id);

		socket.onAny((eventName, ...args) => {
			log('socket.id "%s" event "%s" args: %O', socket.id, eventName, args);
		});

		socket.on('leave_room', async (room: string) => {
			log('socket.id "%s" leave_room %s', socket.id, room);
			socket.leave(room);
		});

		socket.on('join_room', async (room: string) => {
			const socketRequest = socket.request as any;
			log('socket.id "%s" join_room %s', socket.id, room);
			if (!room) {
				return;
			}
			if (
				socketRequest?.locals?.account?.orgs?.some(o =>
					o?.teams?.some(t => t.id.toString() === room)
				)
			) {
				// Room name is same as a team id
				log('socket.id "%s" joined team notification room %s', socket.id, room);
				socket.join(room);
				return socket.emit('joined', room);
			}

			const session = await unsafeGetSessionById(
				socketRequest.locals.isAgentBackend ? room.substring(1) : room
			);
			const canJoinRoom = await checkCanAccessApp(
				session?.appId?.toString(),
				socketRequest.locals.isAgentBackend,
				socketRequest.locals.account
			);

			if (canJoinRoom) {
				socket.join(room);
			}

			if (socketRequest.locals.isAgentBackend === false) {
				log('emitting join to %s', room);
				socket.emit('joined', room); //only send to webapp clients
			} else {
				updateActiveSessionRooms();
			}
		});

		socket.on('stop_generating', async data => {
			const socketRequest = socket.request as any;
			const session = await (socketRequest.locals.isAgentBackend === true
				? unsafeGetSessionById(data.room)
				: getSessionById(socketRequest?.locals?.account?.currentTeam, data.room));
			if (!session) {
				return log('socket.id "%s" stop_generating invalid session %O', socket.id, data);
			}
			client.set(`${data.room}_stop`, '1');
			await (socketRequest.locals.isAgentBackend === true
				? unsafeSetSessionStatus(data.room, SessionStatus.TERMINATED)
				: setSessionStatus(
						socketRequest?.locals?.account?.currentTeam,
						data.room,
						SessionStatus.TERMINATED
					));
			return io.to(data.room).emit('terminate', true);
		});

		socket.on('message', async data => {
			const socketRequest = socket.request as any;
			data.event = data.event || 'message';

			log('socket.id "%s" event "message" args: %O', socket.id, data);

			if (typeof data.message !== 'object') {
				data.message = {
					type: 'text',
					text: data.message
				};
			}

			const message = data.message;

			if (message?.chunkId && message?.text?.length > 0) {
				try {
					if (
						typeof message.text === 'string' &&
						(message.text.startsWith('{') || message.text.startsWith('['))
					) {
						//Note: only tries to JSON stringify objects/arrays because otherwise any number or quoted string is a valid JSON and shows up in a code block, looks weird.
						message.text = JSON.parse(message.text);
						message.language = 'json';
						message.type = 'code';
					}
				} catch (error) {}
			}

			const messageTimestamp = message?.timestamp || Date.now();
			const authorName =
				socketRequest.locals?.account?.name ||
				(socketRequest.locals.isAgentBackend ? data.authorName : 'Me') ||
				'System';
			const finalMessage = {
				...data,
				message: {
					...message,
					chunkId: message?.chunkId || uuidv4()
				},
				incoming: socketRequest.locals.isAgentBackend === false,
				authorName,
				ts: messageTimestamp
			};

			if (!finalMessage.room || finalMessage.room.length !== 24) {
				return log('socket.id "%s" finalMessage invalid room %s', socket.id, finalMessage.room);
			}
			const session = await unsafeGetSessionById(finalMessage.room);
			if (!session) {
				log('socket.id "%s" invalid session %s', socket.id, finalMessage.room);
				return;
			}
			await unsafeSetSessionUpdatedDate(finalMessage.room);
			const chunk: ChatChunk = {
				ts: finalMessage.ts,
				chunk: finalMessage.message.text,
				tokens: finalMessage?.message?.tokens
			};
			const updatedMessage = {
				orgId: session.orgId,
				teamId: session.teamId,
				sessionId: session._id,
				authorId:
					socketRequest.locals.isAgentBackend !== true ? socketRequest?.locals?.account?._id : null,
				authorName: finalMessage.authorName,
				ts: finalMessage.ts || messageTimestamp,
				isFeedback: finalMessage.isFeedback === true,
				chunkId: finalMessage.message.chunkId || null,
				message: finalMessage
			};
			io.to(data.room).emit(data.event, finalMessage);
			await upsertOrUpdateChatMessage(finalMessage.room, updatedMessage, chunk);
			const newStatus = finalMessage?.isFeedback ? SessionStatus.WAITING : SessionStatus.RUNNING;
			if (newStatus !== session.status) {
				//Note: chat messages can be received out of order
				log(
					'socket.id "%s" updating session %s status to %s',
					socket.id,
					finalMessage.room,
					newStatus
				);
				await (socketRequest.locals.isAgentBackend === true
					? unsafeSetSessionStatus(session._id, newStatus)
					: setSessionStatus(socketRequest?.locals?.account?.currentTeam, session._id, newStatus));
				io.to(data.room).emit('status', newStatus);
			}
			if (finalMessage.message && finalMessage.incoming === true) {
				log(
					'socket.id "%s" relaying message %O to private room %s',
					socket.id,
					finalMessage,
					`_${data.room}`
				);
				io.to(`_${data.room}`).emit(data.event, finalMessage.message.text);
			}
		});
	});
}
