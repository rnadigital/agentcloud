'use strict';

import * as db from './index';
import { addTeamToOrg } from './org';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';

export type Team = {
	_id?: ObjectId;
	orgId: ObjectId;
	members: ObjectId[],
	airbyteWorkspaceId?: string;
	name: string;
}

export function TeamCollection() {
	return db.db().collection('teams');
}

export function getTeamById(teamId: db.IdOrStr): Promise<Team> {
	return TeamCollection().findOne({
		_id: toObjectId(teamId),
	});
}

export async function addTeam(team: Team): Promise<db.InsertResult> {
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
