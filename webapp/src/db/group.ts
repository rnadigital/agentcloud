'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';
import { Agent } from './agent';

export type Group = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
    name: string;
	agents: Agent[];
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
