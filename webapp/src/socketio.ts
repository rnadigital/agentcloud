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
	getSessionById,
	setSessionStatus,
	unsafeGetSessionById,
	unsafeSetSessionStatus,
	unsafeSetSessionUpdatedDate
} from 'db/session';
import { SessionStatus } from 'struct/session';

import { SharingMode } from './lib/struct/sharing';

export const io = new Server();

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
		log('socket locals %O', socket.request['locals']);
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
	// 	checkSession(socket.request, socket.request, next, socket);
	// });

	io.on('connection', async socket => {
		log('socket.id "%s" connected', socket.id);

		socket.onAny((eventName, ...args) => {
			log('socket.id "%s" event "%s" args: %O', socket.id, eventName, args);
		});

		socket.on('leave_room', async (room: string) => {
			socket.leave(room);
		});

		socket.on('join_room', async (room: string) => {
			const socketRequest = socket.request as any;
			log('socket.id "%s" join_room %s', socket.id, room);
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
			); // removing _
			if (!session) {
				log('socket.id "%s" invalid session %s', socket.id, room);
				return;
			}
			const foundApp = await unsafeGetAppById(session?.appId);
			if (!foundApp) {
				log('socket.id "%s" app id "%s" not found %s', socket.id, session?.appId, room);
				return;
			}
			log('socket.id "%s" sent join_room %s', socket.id, room);
			// log('foundApp', foundApp);
			switch (foundApp?.sharingConfig?.mode as SharingMode) {
				case SharingMode.PUBLIC:
					socket.join(room);
					break;
				case SharingMode.TEAM:
					const sessionTeamMatch = socketRequest?.locals?.account?.orgs?.some(o =>
						o?.teams?.some(t => t.id.toString() === session.teamId.toString())
					);
					if (!sessionTeamMatch) {
						return;
					}
					socket.join(room);
					break;
				//case SharingMode.RESTRICTED:
				default:
					return; //TODO
			}
			if (socketRequest.locals.isAgentBackend === false) {
				log('emitting join to %s', room);
				socket.emit('joined', room); //only send to webapp clients
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

			let message;
			if (typeof data.message !== 'object') {
				data.message = {
					type: 'text',
					text: data.message
				};
			}
			switch (data.message.type) {
				case 'code':
					if (
						data.message.language === 'json' ||
						(typeof data.message.text === 'string' && data.message.text.startsWith('{'))
					) {
						//monkey patch
						data.message.text = JSON.parse(data.message.text);
						data.message.language = 'json';
					}
					message = data.message;
					break;
				default:
					message = data.message; //any processing?
					break;
			}
			const messageTimestamp = data?.message?.timestamp || Date.now();
			const authorName =
				socketRequest.locals?.account?.name ||
				(socketRequest.locals.isAgentBackend ? data.authorName : 'Me') ||
				'System';
			const finalMessage = {
				...data,
				message,
				incoming: socketRequest.locals.isAgentBackend === false,
				authorName,
				ts: messageTimestamp
			};
			if (!finalMessage?.message?.chunkId) {
				finalMessage.message.chunkId = uuidv4();
			}
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
					socketRequest.locals.isAgentBackend === true ? socketRequest?.locals?.account?._id : null,
				authorName: finalMessage.authorName,
				ts: finalMessage.ts || messageTimestamp,
				isFeedback: finalMessage.isFeedback === true,
				chunkId: finalMessage.message.chunkId || null,
				message: finalMessage
			};
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
			io.to(data.room).emit(data.event, finalMessage);
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
