'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';
import { SessionStatus } from 'struct/session';

export type Session = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
    name: string;
    startDate: Date;
    lastUpdatedDate: Date;
    tokensUsed: number;
	status: SessionStatus;
	crewId?: ObjectId;
	previewLabel?: string;
}

export function SessionCollection(): any {
	return db.db().collection('sessions');
}

export function getSessionById(teamId: db.IdOrStr, sessionId: db.IdOrStr): Promise<Session> {
	return SessionCollection().findOne({
		_id: toObjectId(sessionId),
		teamId: toObjectId(teamId),
	});
}

export function unsafeGetSessionById(sessionId: db.IdOrStr): Promise<Session> {
	return SessionCollection().findOne({
		_id: toObjectId(sessionId),
	});
}

export function getSessionsByTeam(teamId: db.IdOrStr): Promise<Session[]> {
	return SessionCollection().find({
		teamId: toObjectId(teamId),
	}).sort({
		_id: -1,
	}).toArray();
}

export function setSessionStatus(teamId: db.IdOrStr, sessionId: db.IdOrStr, newStatus: SessionStatus): Promise<any> {
	return SessionCollection().updateOne({
		teamId: toObjectId(teamId),
		_id: toObjectId(sessionId),
	}, {
		$set: {
			status: newStatus,
		}
	});
}

export function unsafeSetSessionStatus(sessionId: db.IdOrStr, newStatus: SessionStatus): Promise<any> {
	return SessionCollection().updateOne({
		_id: toObjectId(sessionId),
	}, {
		$set: {
			status: newStatus,
		}
	});
}

export function unsafeSetSessionGroupId(sessionId: db.IdOrStr, groupId: db.IdOrStr): Promise<any> {
	return SessionCollection().updateOne({
		_id: toObjectId(sessionId),
	}, {
		$set: {
			groupId: toObjectId(groupId),
		}
	});
}

export function unsafeIncrementTokens(sessionId: db.IdOrStr, tokens: number): Promise<any> {
	return SessionCollection().findOneAndUpdate({
		_id: toObjectId(sessionId),
	},{
		$inc: {
			tokensUsed: tokens,
		}
	},{
		returnDocument: 'after'
	});
}

export function unsafeSetSessionUpdatedDate(sessionId: db.IdOrStr): Promise<any> {
	return SessionCollection().updateOne({
		_id: toObjectId(sessionId),
	}, {
		$set: {
			lastUpdatedDate: new Date(),
		}
	});
}

export async function addSession(session: Session): Promise<InsertResult> {
	return SessionCollection().insertOne(session);
}

export function deleteSessionById(teamId: db.IdOrStr, sessionId: db.IdOrStr): Promise<any> {
	return SessionCollection().deleteOne({
		_id: toObjectId(sessionId),
		teamId: toObjectId(teamId),
	});
}
