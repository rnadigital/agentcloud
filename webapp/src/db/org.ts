'use strict';

import { ObjectId } from 'mongodb';

import toObjectId from '../lib/misc/toobjectid';
import * as db from './index';

export type Org = {
	_id?: ObjectId;
	teamIds: ObjectId[],
	members: ObjectId[],
	name: string;
}

export function OrgCollection() {
	return db.db().collection('orgs');
}

export function getOrgById(orgId: db.IdOrStr): Promise<Org> {
	return OrgCollection().findOne({
		_id: toObjectId(orgId),
	});
}

export function addOrg(org: Org): Promise<db.InsertResult> {
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
