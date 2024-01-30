'use strict';

import * as db from 'db/index';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';

import toObjectId from '../lib/misc/toobjectid';
import { addTeamToOrg } from './org';

export type Team = {
	_id?: ObjectId;
	orgId: ObjectId;
	members: ObjectId[],
	airbyteWorkspaceId?: string;
	name: string;
}

export function TeamCollection(): any {
	return db.db().collection('teams');
}

export function getTeamById(teamId: db.IdOrStr): Promise<Team> {
	return TeamCollection().findOne({
		_id: toObjectId(teamId),
	});
}

export async function addTeam(team: Team): Promise<InsertResult> {
	const insertedTeam = await TeamCollection().insertOne(team);
	await addTeamToOrg(team.orgId, insertedTeam.insertedId);
	return insertedTeam;
}

export function renameTeam(teamId: db.IdOrStr, newName: string): Promise<any> {
	return TeamCollection().updateOne({
		_id: toObjectId(teamId),
	}, {
		$set: {
			name: newName,
		},
	});
}

export function addTeamMember(teamId: db.IdOrStr, accountId: db.IdOrStr): Promise<any> {
	return TeamCollection().updateOne({
		_id: toObjectId(teamId),
	}, {
		$push: {
			members: toObjectId(accountId),
		},
	});
}

export function removeTeamMember(teamId: db.IdOrStr, accountId: db.IdOrStr): Promise<any> {
	return TeamCollection().updateOne({
		_id: toObjectId(teamId),
	}, {
		$pullAll: {
			members: [toObjectId(accountId)],
		},
	});
}

export async function getTeamWithMembers(teamId: db.IdOrStr): Promise<any> {
	return TeamCollection().aggregate([
		{
			$match: {
				_id: toObjectId(teamId)
			}
		},
		{
			$lookup: {
				from: 'accounts', // The collection to join.
				localField: 'members', // Field from the 'teams' collection.
				foreignField: '_id', // Field from the 'accounts' collection.
				as: 'members' // The array field to hold the joined data.
			}
		},
		{
			$lookup: {
				from: 'orgs', // The collection to join.
				localField: 'orgId', // Field from the 'teams' collection.
				foreignField: '_id', // Field from the 'accounts' collection.
				as: 'orgs' // The array field to hold the joined data.
			}
		},
		{
			$unwind: '$orgs'
		},
		{
			$project: {
				_id: 1,
				orgId: 1,
				airbyteWorkspaceId: 1,
				name: 1,
				members: {
					$map: {
						input: '$members',
						as: 'member',
						in: {
							_id: '$$member._id',
							name: '$$member.name',
							email: '$$member.email',
							emailVerified: '$$member.emailVerified', //know if vreified or not (implies accepted invite)
							memberId: '$$member._id',    
							teamOwner: {
								$in: ['$$member._id','$orgs.members']
							}
						}
					}
				}
			}
		}
	]).toArray();
}
