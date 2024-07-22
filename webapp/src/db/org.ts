'use strict';

import Permission from '@permission';
import * as db from 'db/index';
import { Binary, ObjectId } from 'mongodb';
import Roles from 'permissions/roles';
import { InsertResult } from 'struct/db';

import toObjectId from '../lib/misc/toobjectid';

export type Org = {
	_id?: ObjectId;
	ownerId: ObjectId;
	teamIds: ObjectId[];
	members: ObjectId[];
	name: string;
	dateCreated: Date;
	permissions: Record<string, Binary>;
};

export function OrgCollection(): any {
	return db.db().collection('orgs');
}

export function getOrgById(orgId: db.IdOrStr): Promise<Org> {
	return OrgCollection().findOne({
		_id: toObjectId(orgId)
	});
}

export function addOrg(org: Org): Promise<InsertResult> {
	return OrgCollection().insertOne(org);
}

export function addTeamToOrg(orgId: db.IdOrStr, teamId: db.IdOrStr): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$addToSet: {
				teamIds: toObjectId(teamId)
			}
		}
	);
}

export function addOrgAdmin(orgId: db.IdOrStr, accountId: db.IdOrStr): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$push: {
				admins: toObjectId(accountId) //Note: is the members array now redeundant that we have memberIds in the permissions map?
			},
			$set: {
				[`permissions.${accountId}`]: new Binary(new Permission(Roles.REGISTERED_USER.base64).array)
			}
		}
	);
}

export function removeOrgAdmin(orgId: db.IdOrStr, accountId: db.IdOrStr): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$pullAll: {
				admins: [toObjectId(accountId)]
			},
			$unset: {
				[`permissions.${accountId}`]: ''
			}
		}
	);
}

export function renameOrg(orgId: db.IdOrStr, newName: string): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$set: {
				name: newName
			}
		}
	);
}
