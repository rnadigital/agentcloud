'use strict';

import { createAdapter } from '@socket.io/redis-adapter';
import debug from 'debug';
import { Server } from 'socket.io';

import { client } from './lib/redis/redis';
const log = debug('webapp:socket');
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { timingSafeEqual } from 'crypto';
import { addAgents } from 'db/agent';
import { addChatMessage, ChatChunk, getAgentMessageForSession, unsafeGetTeamJsonMessage, updateCompletedMessage, updateMessageWithChunkById } from 'db/chat';
import { getSessionById, setSessionStatus, unsafeGetSessionById, unsafeIncrementTokens, unsafeSetSessionStatus, unsafeSetSessionUpdatedDate } from 'db/session';
import { ObjectId } from 'mongodb';
import { taskQueue } from 'queue/bull';
import { SessionStatus, SessionType } from 'struct/session';

import checkSession from './lib/middleware/auth/checksession';
import fetchSession from './lib/middleware/auth/fetchsession';
import useJWT from './lib/middleware/auth/usejwt';
import useSession from './lib/middleware/auth/usesession';

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
		log('socket.id %s backendToken %s', socket.id, backendToken);
		socket.request['locals'].isAgentBackend = backendToken.length === process.env.AGENT_BACKEND_SOCKET_TOKEN.length && timingSafeEqual(
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
	io.use((socket, next) => {
		checkSession(socket.request, socket.request, next, socket);
	});

	io.on('connection', async (socket) => {
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
			if (socketRequest?.locals?.account?.orgs?.some(o => o?.teams?.some(t => t.id.toString() === room))) {
				// Room name is same as a team id
				log('socket.id "%s" joined team notification room %s', socket.id, room);
				return socket.join(room);
			}
			const session = await (socketRequest.locals.isAgentBackend === true
				? unsafeGetSessionById(room.substring(1)) // removing _
				: getSessionById(socketRequest?.locals?.account?.currentTeam, room));
			if (!session) {
				log('socket.id "%s" invalid session %s', socket.id, room);
				return;
			}
			log('socket.id "%s" joined room %s', socket.id, room);
			socket.join(room);
			if (socketRequest.locals.isAgentBackend !== true) {
				socket.emit('joined', room); //only send to webapp clients
			}
		});

		socket.on('terminate', async (data) => {
			const socketRequest = socket.request as any;
			const session = await (socketRequest.locals.isAgentBackend === true
				? unsafeGetSessionById(data.message.sessionId)
				: getSessionById(socketRequest?.locals?.account?.currentTeam, data.message.sessionId));
			if (!session) {
				return log('socket.id "%s" terminate invalid session %s', socket.id, data.message.sessionId);
			}
			await (socketRequest.locals.isAgentBackend === true
				? unsafeSetSessionStatus(session._id, SessionStatus.TERMINATED)
				: setSessionStatus(socketRequest?.locals?.account?.currentTeam, session._id, SessionStatus.TERMINATED));
			log('socket.id "%s" terminate %s', socket.id, session._id);
			return io.to(data.room).emit('terminate', true);
		});

		socket.on('message', async (data) => {
			const socketRequest = socket.request as any;
			data.event = data.event || 'message';
			const messageTimestamp = data?.message?.timestamp || Date.now();
			if (typeof data.message !== 'object') {
				data.message = {
					type: 'text',
					text: data.message,
				};
			}
			let message;
			switch (data.message.type) {
				case 'code':
					if (data.message.language === 'json'
						|| (typeof data.message.text === 'string'
							&& data.message.text.startsWith('{'))) { //monkey patch
						data.message.text = JSON.parse(data.message.text);
						data.message.language = 'json';
					}
					message = data.message;
					break;
				default:
					message = data.message; //any processing?
					break;
			}
			const finalMessage = {
				...data,
				message,
				incoming: socketRequest.locals.isAgentBackend === false,
				authorName: data.authorName || 'System',
				ts: messageTimestamp,
			};
			if (!finalMessage.room || finalMessage.room.length !== 24) {
				return log('socket.id "%s" finalMessage invalid room %s', socket.id, finalMessage.room);
			}
			const session = await (socketRequest.locals.isAgentBackend === true
				? unsafeGetSessionById(finalMessage.room)
				: getSessionById(socketRequest?.locals?.account?.currentTeam, finalMessage.room));
			if (!session) {
				return log('socket.id "%s" message invalid session %s', socket.id, finalMessage.room);
			}
			await unsafeSetSessionUpdatedDate(finalMessage.room);
			const chunk: ChatChunk = { ts: finalMessage.ts, chunk: finalMessage.message.text, tokens: finalMessage?.message?.tokens };
			if (finalMessage.message.first === false) {
				//This is a previous message that is returning in chunks
				await updateMessageWithChunkById(finalMessage.room, finalMessage.message.chunkId, chunk);
				if (chunk?.tokens != null && chunk?.tokens > 0) {
					await unsafeIncrementTokens(finalMessage.room, chunk?.tokens);
				}
				//const updatedSession = await unsafeIncrementTokens(finalMessage.room, chunk?.tokens);
				//io.to(data.room).emit('tokens', updatedSession.tokensUsed);
			} else {
				await addChatMessage({
					orgId: session.orgId,
					teamId: session.teamId,
					sessionId: session._id,
					message: finalMessage,
					type: session.type as SessionType,
					authorId: socketRequest.locals.isAgentBackend === true ? socketRequest?.locals?.account?._id : null,
					authorName: socketRequest.locals.isAgentBackend === true ? socketRequest?.locals?.account?.name : 'AgentCloud',
					ts: finalMessage.ts || messageTimestamp,
					isFeedback: finalMessage?.isFeedback || false,
					chunkId: finalMessage.message.chunkId || null,
					tokens: finalMessage?.message?.tokens || 0,
					displayMessage: finalMessage?.displayMessage || null,
					chunks: finalMessage?.message?.single ? [] : [chunk],
				});
			}
			const newStatus = finalMessage?.isFeedback ? SessionStatus.WAITING : SessionStatus.RUNNING;
			if (newStatus !== session.status) { //Note: chat messages can be received out of order
				log('socket.id "%s" updating session %s status to %s', socket.id, finalMessage.room, newStatus);
				await (socketRequest.locals.isAgentBackend === true
					? unsafeSetSessionStatus(session._id, newStatus)
					: setSessionStatus(socketRequest?.locals?.account?.currentTeam, session._id, newStatus));
				io.to(data.room).emit('status', newStatus);
			}
			io.to(data.room).emit(data.event, finalMessage);
			if (finalMessage.message && finalMessage.incoming === true) {
				log('socket.id "%s" relaying message %O to private room %s', socket.id, finalMessage, `_${data.room}`);
				io.to(`_${data.room}`).emit(data.event, finalMessage.message.text);
			}
		});

		socket.on('stop_generating', async (data) => {
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
				: setSessionStatus(socketRequest?.locals?.account?.currentTeam, data.room, SessionStatus.TERMINATED));
			return io.to(data.room).emit('terminate', true);
		});

		socket.on('message_complete', async (data) => {
			const socketRequest = socket.request as any;
			if (socketRequest.locals.isAgentBackend !== true) {
				return log('socket.id "%s" message_complete invalid session %s', socket.id, data?.room);
			}
			if (data?.message?.text) {
				await updateCompletedMessage(data.room, data.message.chunkId, data.message.text, data.message.codeBlocks, data.message.deltaTokens || 0);
				if (data?.message?.deltaTokens != null && data?.message?.deltaTokens > 0) {
					const updatedSession = await unsafeIncrementTokens(data.room, data.message.deltaTokens);
					io.to(data.room).emit('tokens', updatedSession.tokensUsed);
				}
			}
		});

	});

}
