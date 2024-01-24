'use strict';

import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { Group } from 'struct/group';

import * as db from './index';

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

export function getGroupsWithAgent(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<Group[]> {
	return GroupCollection().find({
		teamId: toObjectId(teamId),
		$or: [
			{ agents: toObjectId(agentId) },
			{ adminAgent: toObjectId(agentId) },
		],
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

export function removeAgentFromGroups(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<any> {
	return GroupCollection().bulkWrite([
		{
			updateMany: {
				filter: {
					adminAgent: toObjectId(agentId),
					teamId: toObjectId(teamId),
				},
				update: {
					$unset: {
						adminAgent: '',
					}
				},
			}
		},
		{
			updateMany: {
				filter: {
					agents: toObjectId(agentId),
					teamId: toObjectId(teamId),
				},
				update: {
					$pull: {
						agents: toObjectId(agentId),
					}
				},
			}
		}
	]);
}

export function deleteGroupById(teamId: db.IdOrStr, groupId: db.IdOrStr): Promise<any> {
	return GroupCollection().deleteOne({
		_id: toObjectId(groupId),
		teamId: toObjectId(teamId),
	});
}
