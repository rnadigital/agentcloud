'use strict';

import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { SessionType } from 'struct/session';

import * as db from './index';

export type ChatChunk = {
	ts: number;
	chunk: string;
	tokens: number; //might remove
}

export type ChatCodeBlock = {
	language: string;
	codeBlock: string;
}

export type ChatMessage = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	sessionId: ObjectId;
	chunkId?: string;
	message: any;
	displayMessage: string;
	ts: number;
	type: SessionType,
	authorId: ObjectId;
	isFeedback: boolean;
	authorName: string;
	tokens?: number;
	chunks?: ChatChunk[];
	codeBlocks?: ChatCodeBlock[];
	completed?: boolean;
}

export function ChatCollection() {
	return db.db().collection('chat');
}

export function getChatMessageById(teamId: db.IdOrStr, messageId: db.IdOrStr): Promise<ChatMessage> {
	return ChatCollection().findOne({
		_id: toObjectId(messageId),
		teamId: toObjectId(teamId),
	});
}

export function getChatMessagesBySession(teamId: db.IdOrStr, sessionId: db.IdOrStr): Promise<ChatMessage[]> {
	return ChatCollection().find({
		sessionId: toObjectId(sessionId),
		teamId: toObjectId(teamId),
	}).toArray();
}

export function getAgentMessageForSession(sessionId: db.IdOrStr): Promise<ChatMessage> {
	return ChatCollection().findOne({
		sessionId: toObjectId(sessionId),
		'message.incoming': false,
	});
}

export function unsafeGetTeamJsonMessage(sessionId: db.IdOrStr): Promise<ChatMessage|null> {
	return ChatCollection().find({
		sessionId: toObjectId(sessionId),
		'codeBlocks.language': 'json',
		type: SessionType.TEAM,
	}).sort({
		_id: -1,
	}).limit(1).toArray().then(res => res && res.length > 0 ? res[0] : null);
}

export async function updateMessageWithChunkById(sessionId: db.IdOrStr, chunkId: string, chunk: ChatChunk) {
	return ChatCollection().updateOne({
		sessionId: toObjectId(sessionId),
		chunkId,
		completed: {
			$ne: true,
		},
	}, {
		$push: {
			chunks: chunk,
		},
		$inc: {
			tokens: chunk.tokens || 0,
		}
	});
}

export async function updateCompletedMessage(sessionId: db.IdOrStr, chunkId: string, text: string, codeBlocks: ChatCodeBlock, tokens: number) {
	const update = {
		$unset: {
			chunks: '',
		},
		$set: {
			'message.message.text': text,
			codeBlocks,
			completed: true,
		},
		$inc: {
			tokens: tokens || 0,
		}
	};
	return ChatCollection().updateOne({
		sessionId: toObjectId(sessionId),
		chunkId,
	}, update);
}

export async function addChatMessage(chatMessage: ChatMessage): Promise<db.InsertResult> {
	return ChatCollection().insertOne(chatMessage);
}

export function getLatestChatMessage(sessionId: db.IdOrStr): Promise<ChatMessage|null> {
	return ChatCollection().findOne({
		sessionId: toObjectId(sessionId),
	}, null, {
		sort: {
			ts: -1, //TODO: revise ts
		}
	});
}
