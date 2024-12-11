'use strict';

import Permission from '@permission';
import * as db from 'db/index';
import { Binary, ObjectId } from 'mongodb';
import { REGISTERED_USER } from 'permissions/roles';
import { AccountStripeData, SubscriptionPlan } from 'struct/billing';
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
	stripe?: AccountStripeData;
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

export function editOrg(orgId: db.IdOrStr, update: Partial<Org>): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$set: update
		}
	);
}

export function getAllOrgMembers(teamId: db.IdOrStr, orgId: db.IdOrStr): Promise<any[]> {
	return OrgCollection()
		.aggregate([
			{
				// Match the specific org by orgId
				$match: {
					_id: toObjectId(orgId),
					teamIds: toObjectId(teamId)
				}
			},
			{
				// Lookup teams from the teams collection using teamIds from the org
				$lookup: {
					from: 'teams', // Assuming your teams collection is called 'teams'
					localField: 'teamIds',
					foreignField: '_id',
					as: 'teams'
				}
			},
			{
				// Unwind the teams array so we can handle each team individually
				$unwind: '$teams'
			},
			{
				// Unwind the members array within each team
				$unwind: '$teams.members'
			},
			{
				// Group by the unique member ID to deduplicate
				$group: {
					_id: '$teams.members' // Group by member ObjectId
				}
			},
			{
				// Lookup the member details from the Account collection
				$lookup: {
					from: 'accounts',
					localField: '_id', // _id is the member ID after deduplication
					foreignField: '_id', // Join on the _id of the Account collection
					as: 'memberDetails' // Store the account details in 'memberDetails'
				}
			},
			{
				// Unwind the memberDetails array (since it's an array after $lookup)
				$unwind: '$memberDetails'
			},
			{
				// Project only the fields you need from the member details
				$project: {
					memberId: '$memberDetails._id',
					name: '$memberDetails.name',
					email: '$memberDetails.email',
					emailVerified: '$memberDetails.emailVerified'
				}
			}
		])
		.toArray();
}

export function getAllOrgTeams(orgId: db.IdOrStr): Promise<Org> {
	return OrgCollection().findOne({ _id: toObjectId(orgId) }, { teamIds: 1, _id: 0 });
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

export function setMemberPermissions(
	orgId: db.IdOrStr,
	accountId: db.IdOrStr,
	permissions: Permission
): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$set: {
				[`permissions.${accountId.toString()}`]: new Binary(permissions.array)
			}
		}
	);
}

export function setOrgStripePlan(orgId: db.IdOrStr, plan: SubscriptionPlan): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$set: {
				'stripe.stripePlan': plan
			}
		}
	);
}

export function setOrgStripeCustomerId(orgId: db.IdOrStr, stripeCustomerId: string): Promise<any> {
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$set: {
				'stripe.stripeCustomerId': stripeCustomerId
			}
		}
	);
}

export function updateOrgStripeCustomer(
	orgId: db.IdOrStr,
	update: Partial<Org['stripe']>
): Promise<any> {
	const updateObj = {};
	for (const [key, value] of Object.entries(update)) {
		updateObj[`stripe.${key}`] = value;
	}
	return OrgCollection().updateOne(
		{
			_id: toObjectId(orgId)
		},
		{
			$set: updateObj
		}
	);
}

export function getOrgByStripeCustomerId(stripeCustomerId: string): Promise<Org> {
	return OrgCollection().findOne({
		'stripe.stripeCustomerId': stripeCustomerId
	});
}
