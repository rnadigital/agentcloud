'use strict';

import Permission from '@permission';
import * as db from 'db/index';
import { Binary, ObjectId } from 'mongodb';
import Permissions from 'permissions/permissions';
import { TeamRoleKey, TeamRoles } from 'permissions/roles';
import { InsertResult } from 'struct/db';

import toObjectId from '../lib/misc/toobjectid';
import { addTeamToOrg } from './org';

export type Team = {
	_id?: ObjectId;
	ownerId: ObjectId;
	orgId: ObjectId;
	members: ObjectId[];
	name: string;
	dateCreated: Date;
	permissions: Record<string, Binary>;
	defaultModelConfig?: {
		llm: ObjectId;
		embedding: ObjectId;
	};
};

export function TeamCollection(): any {
	return db.db().collection('teams');
}

export function getTeamById(teamId: db.IdOrStr): Promise<Team> {
	return TeamCollection().findOne({
		_id: toObjectId(teamId)
	});
}

export function getTeamsById(teamIds: db.IdOrStr[]): Promise<Team[]> {
	return TeamCollection()
		.find({
			_id: {
				$in: teamIds.map(toObjectId)
			}
		})
		.toArray();
}

export async function addTeam(team: Team): Promise<InsertResult> {
	const insertedTeam = await TeamCollection().insertOne(team);
	await addTeamToOrg(team.orgId, insertedTeam.insertedId);
	return insertedTeam;
}

export function editTeam(teamId: db.IdOrStr, update: Partial<Team>): Promise<any> {
	return TeamCollection().updateOne(
		{
			_id: toObjectId(teamId)
		},
		{
			$set: update
		}
	);
}

export function addTeamMember(
	teamId: db.IdOrStr,
	accountId: db.IdOrStr,
	role: TeamRoleKey = 'TEAM_MEMBER'
): Promise<any> {
	return TeamCollection().updateOne(
		{
			_id: toObjectId(teamId)
		},
		{
			$push: {
				members: toObjectId(accountId) //Note: is the members array now redeundant that we have memberIds in the permissions map?
			},
			$set: {
				[`permissions.${accountId}`]: new Binary(TeamRoles[role].array)
			}
		}
	);
}

export function removeTeamMember(teamId: db.IdOrStr, accountId: db.IdOrStr): Promise<any> {
	return TeamCollection().updateOne(
		{
			_id: toObjectId(teamId)
		},
		{
			$pullAll: {
				members: [toObjectId(accountId)]
			},
			$unset: {
				[`permissions.${accountId}`]: ''
			}
		}
	);
}

export function removeTeamsMember(
	teamIds: db.IdOrStr[],
	orgId: db.IdOrStr,
	accountId: db.IdOrStr
): Promise<any> {
	return TeamCollection().updateOne(
		{
			_id: {
				$in: teamIds.map(toObjectId)
			},
			orgId: orgId
		},
		{
			$pullAll: {
				members: [toObjectId(accountId)]
			},
			$unset: {
				[`permissions.${accountId}`]: ''
			}
		}
	);
}

export function setMemberPermissions(
	teamId: db.IdOrStr,
	accountId: db.IdOrStr,
	permissions: Permission
): Promise<any> {
	return TeamCollection().updateOne(
		{
			_id: toObjectId(teamId)
		},
		{
			$set: {
				[`permissions.${accountId.toString()}`]: new Binary(permissions.array)
			}
		}
	);
}

export async function getTeamWithModels(teamId: db.IdOrStr): Promise<any> {
	return TeamCollection()
		.aggregate([
			{
				$match: {
					_id: toObjectId(teamId)
				}
			},
			{
				$lookup: {
					from: 'models',
					localField: 'defaultModelConfig.llm',
					foreignField: '_id',
					as: 'llmModel'
				}
			},
			{
				$unwind: {
					path: '$llmModel',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: 'models',
					localField: 'defaultModelConfig.embedding',
					foreignField: '_id',
					as: 'embeddingModel'
				}
			},
			{
				$unwind: {
					path: '$embeddingModel',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$project: {
					_id: 1,
					ownerId: 1,
					orgId: 1,
					name: 1,
					dateCreated: 1,
					permissions: 1,
					members: 1,
					llmModel: 1,
					embeddingModel: 1
				}
			}
		])
		.next();
}

export async function getTeamWithMembers(teamId: db.IdOrStr): Promise<any> {
	return TeamCollection()
		.aggregate([
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
					name: 1,
					ownerId: 1,
					permissions: 1, //TODO: later project away for lower perms users
					members: {
						$map: {
							input: '$members',
							as: 'member',
							in: {
								_id: '$$member._id',
								name: '$$member.name',
								email: '$$member.email',
								emailVerified: '$$member.emailVerified', //know if verified or not (implies accepted invite)
								memberId: '$$member._id'
							}
						}
					},
					llmModel: { $arrayElemAt: ['$llmModel', 0] },
					embeddingModel: { $arrayElemAt: ['$embeddingModel', 0] }
				}
			}
		])
		.toArray()
		.then(res => res[0]);
}

export async function updateTeamOwner(teamId: db.IdOrStr, newOwnerId: db.IdOrStr): Promise<any> {
	return TeamCollection().updateOne(
		{
			_id: toObjectId(teamId)
		},
		{
			$set: {
				ownerId: toObjectId(newOwnerId)
			}
		}
	);
}

export async function setDefaultModel(
	teamId: db.IdOrStr,
	modelId: db.IdOrStr,
	modelType: 'llm' | 'embedding'
): Promise<any> {
	return TeamCollection().updateOne(
		{
			_id: toObjectId(teamId)
		},
		{
			$set: {
				[`defaultModelConfig.${modelType}`]: toObjectId(modelId)
			}
		}
	);
}
