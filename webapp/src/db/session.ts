'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';
import { SessionStatus } from 'struct/session';
import { SharingConfig, SharingMode } from 'struct/sharing';
import debug from 'debug';
const log = debug('webapp:db:session')
import { unsafeGetAppById } from 'db/app';

export type Session = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	name: string;
	startDate: Date;
	lastUpdatedDate: Date;
	tokensUsed: number;
	status: SessionStatus;
	appId?: ObjectId;
	previewLabel?: string;
	sharingConfig: SharingConfig;
};

export function SessionCollection(): any {
	return db.db().collection('sessions');
}

export function getSessionById(teamId: db.IdOrStr, sessionId: db.IdOrStr): Promise<Session> {
	return SessionCollection().findOne({
		_id: toObjectId(sessionId),
		teamId: toObjectId(teamId)
	});
}

export function unsafeGetSessionById(sessionId: db.IdOrStr): Promise<Session> {
	return SessionCollection().findOne({
		_id: toObjectId(sessionId)
	});
}

export function getSessionsByTeam(
	teamId: db.IdOrStr,
	before: db.IdOrStr,
	limit: number
): Promise<Session[]> {
	return SessionCollection()
		.find({
			teamId: toObjectId(teamId),
			...(before ? { _id: { $lt: toObjectId(before) } } : {})
		})
		.sort({
			_id: -1
		})
		.limit(limit)
		.toArray();
}

export function setSessionStatus(
	teamId: db.IdOrStr,
	sessionId: db.IdOrStr,
	newStatus: SessionStatus
): Promise<any> {
	return SessionCollection().updateOne(
		{
			teamId: toObjectId(teamId),
			_id: toObjectId(sessionId)
		},
		{
			$set: {
				status: newStatus
			}
		}
	);
}

export function unsafeSetSessionStatus(
	sessionId: db.IdOrStr,
	newStatus: SessionStatus
): Promise<any> {
	return SessionCollection().updateOne(
		{
			_id: toObjectId(sessionId)
		},
		{
			$set: {
				status: newStatus
			}
		}
	);
}

export function unsafeSetSessionGroupId(sessionId: db.IdOrStr, groupId: db.IdOrStr): Promise<any> {
	return SessionCollection().updateOne(
		{
			_id: toObjectId(sessionId)
		},
		{
			$set: {
				groupId: toObjectId(groupId)
			}
		}
	);
}

export function unsafeIncrementTokens(sessionId: db.IdOrStr, tokens: number): Promise<any> {
	return SessionCollection().findOneAndUpdate(
		{
			_id: toObjectId(sessionId)
		},
		{
			$inc: {
				tokensUsed: tokens
			}
		},
		{
			returnDocument: 'after'
		}
	);
}

export function unsafeSetSessionUpdatedDate(sessionId: db.IdOrStr): Promise<any> {
	return SessionCollection().updateOne(
		{
			_id: toObjectId(sessionId)
		},
		{
			$set: {
				lastUpdatedDate: new Date()
			}
		}
	);
}

export async function addSession(session: Session): Promise<InsertResult> {
	return SessionCollection().insertOne(session);
}

export function deleteSessionById(teamId: db.IdOrStr, sessionId: db.IdOrStr): Promise<any> {
	return SessionCollection().deleteOne({
		_id: toObjectId(sessionId),
		teamId: toObjectId(teamId)
	});
}

export async function checkCanAccessSession(sessionId: string, isAgentBackend: boolean, account: any): Promise<boolean> {
	const session = await unsafeGetSessionById(isAgentBackend ? sessionId.substring(1) : sessionId);
	if (!session) {
		log('Invalid session %s', sessionId);
		return false;
	}

	const foundApp = await unsafeGetAppById(session?.appId);
	if (!foundApp) {
		log('App id "%s" not found for session %s', session?.appId, sessionId);
		return false;
	}

	//TODO: maybe adjust whether the session or app sharingConfig is checked
	switch (foundApp?.sharingConfig?.mode as SharingMode) {
		case SharingMode.PUBLIC:
			return true;
		case SharingMode.TEAM:
			const sessionTeamMatch = account?.orgs?.some(o =>
				o?.teams?.some(t => t.id.toString() === session.teamId.toString())
			);
			return sessionTeamMatch || isAgentBackend;
		case SharingMode.WHITELIST:
			const hasPermissionEntry = foundApp?.sharingConfig?.permissions[account?._id];
			return hasPermissionEntry || isAgentBackend;
		case SharingMode.OWNER:
			const isAppOwner = foundApp?.sharingConfig?.permissions[account?._id];
			return isAppOwner || isAgentBackend;
		default:
			return false;
	}
}
