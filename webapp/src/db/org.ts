'use strict';

import * as db from 'db/index';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';

import toObjectId from '../lib/misc/toobjectid';

export type Org = {
	_id?: ObjectId;
	teamIds: ObjectId[],
	members: ObjectId[],
	name: string;
}

export function OrgCollection(): any {
	return db.db().collection('orgs');
}

export function getOrgById(orgId: db.IdOrStr): Promise<Org> {
	return OrgCollection().findOne({
		_id: toObjectId(orgId),
	});
}

export function addOrg(org: Org): Promise<InsertResult> {
	return OrgCollection().insertOne(org);
}

export function addTeamToOrg(orgId: db.IdOrStr, teamId: db.IdOrStr): Promise<any> {
	return OrgCollection().updateOne({
		_id: toObjectId(orgId),
	}, {
		$addToSet: {
			teamIds: toObjectId(teamId),
		},
	});
}

export function renameOrg(orgId: db.IdOrStr, newName: string): Promise<any> {
	return OrgCollection().updateOne({
		_id: toObjectId(orgId),
	}, {
		$set: {
			name: newName,
		},
	});
}
