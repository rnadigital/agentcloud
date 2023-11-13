'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';

export type Group = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	adminAgent: ObjectId;
	agents: ObjectId[];
};

export function GroupCollection() {
	return db.db().collection('groups');
}

export function getGroupById(teamId: db.IdOrStr, groupId: db.IdOrStr): Promise<Group> {
	return GroupCollection().findOne({
		_id: toObjectId(groupId),
		teamId: toObjectId(teamId),
	});
}

export function getGroupsByTeam(teamId: db.IdOrStr): Promise<Group[]> {
	return GroupCollection().find({
		teamId: toObjectId(teamId),
	}).toArray();
}

export async function addGroup(group: Group): Promise<db.InsertResult> {
	return GroupCollection().insertOne(group);
}

export async function updateGroup(teamId: db.IdOrStr, groupId: db.IdOrStr, group: Group): Promise<db.InsertResult> {
	return GroupCollection().updateOne({
		_id: toObjectId(groupId),
		teamId: toObjectId(teamId),
	}, {
		$set: group,
	});
}

export function deleteGroupById(teamId: db.IdOrStr, groupId: db.IdOrStr): Promise<any> {
	return GroupCollection().deleteOne({
		_id: toObjectId(groupId),
		teamId: toObjectId(teamId),
	});
}
