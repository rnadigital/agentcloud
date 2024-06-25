'use strict';

import * as db from 'db/index';
import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { UpdateResult } from 'mongodb';
import { InsertResult } from 'struct/db';
import { CollectionName } from 'struct/db';
import { ToolRevision } from 'struct/toolrevision';

const log = debug('webapp:db:toolrevisions');

export function ToolRevisionCollection(): any {
	return db.db().collection(CollectionName.Toolrevisions);
}

export function getRevisionById(teamId: db.IdOrStr, revisionId: db.IdOrStr): Promise<ToolRevision> {
	return ToolRevisionCollection().findOne({
		_id: toObjectId(revisionId),
		teamId: toObjectId(teamId),
	});
}

export function getRevisionsById(teamId: db.IdOrStr, revisionIds: db.IdOrStr[]): Promise<ToolRevision[]> {
	return ToolRevisionCollection().find({
		_id: {
			$in: revisionIds.map(toObjectId),
		},
		teamId: toObjectId(teamId),
	}).toArray();
}

export function getRevisionsForTool(teamId: db.IdOrStr, toolId: db.IdOrStr, limit: number=100): Promise<ToolRevision[]> {
	return ToolRevisionCollection().find({
		teamId: toObjectId(teamId),
		toolId: toObjectId(toolId),
	}).sort({
		date: -1,
	}).limit(limit).toArray();
}

export function getToolsByTeam(teamId: db.IdOrStr): Promise<ToolRevision[]> {
	return ToolRevisionCollection().find({
		teamId: toObjectId(teamId)
	}).toArray();
}

export async function addToolRevision(toolRevision: ToolRevision): Promise<InsertResult> {
	return ToolRevisionCollection().insertOne(toolRevision);
}

export function deleteRevisionsForTool(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<any> {
	return ToolRevisionCollection().deleteMany({
		teamId: toObjectId(teamId),
		toolId: toObjectId(toolId),
	});
}

export function deleteRevisionById(teamId: db.IdOrStr, revisionId: db.IdOrStr): Promise<any> {
	return ToolRevisionCollection().deleteOne({
		_id: toObjectId(revisionId),
		teamId: toObjectId(teamId),
	});
}
