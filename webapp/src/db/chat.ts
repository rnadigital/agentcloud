'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';
import { SessionType } from './session';

export type ChatMessage = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	sessionId: ObjectId;
	message: any;
	ts: number;
	type: SessionType,
	authorId: ObjectId;
	isFeedback: boolean;
	authorName: string; //Downside, author names need to be updated in historical chats if we want
						//Upside, more efficient because we don't need to query all authors for a chat and store them in a map to display names on the frontend
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

export function unsafeGetTeamJsonMessage(sessionId: db.IdOrStr): Promise<ChatMessage|null> {
	return ChatCollection().find({
		sessionId: toObjectId(sessionId),
		'message.message.type': 'code',
		'message.message.language': 'json', //TODO once fixed in autogen fork
		type: SessionType.TEAM,
	}).sort({
		_id: -1,
	}).limit(1).toArray().then(res => res && res.length > 0 ? res[0] : null);
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
