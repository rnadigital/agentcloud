'use strict';

import Permission from '@permission';
import * as db from 'db/index';
import { Binary, ObjectId } from 'mongodb';
import { AccountStripeData, SubscriptionPlan } from 'struct/billing';
import { InsertResult } from 'struct/db';
import { OAUTH_PROVIDER } from 'struct/oauth';

import toObjectId from '../lib/misc/toobjectid';

export type AccountTeam = {
	id: ObjectId;
	name: string;
	ownerId: ObjectId;
	//permissions: Binary; //TODO?
};

export type AccountOrg = {
	id: ObjectId;
	name: string;
	ownerId: ObjectId;
	teams: AccountTeam[];
	//permissions: Binary; //TODO?
};

// OAuth data for account
export type AccountOAuthId = string | number;
export type AccountOAuthData = {
	id: AccountOAuthId;
	// potentially more stuff here later...
};
export type OAuthRecordType = Partial<Record<OAUTH_PROVIDER, AccountOAuthData>>;

export type Account = {
	_id?: ObjectId;
	name: string;
	email?: string;
	passwordHash?: string;
	orgs: AccountOrg[];
	currentOrg: ObjectId;
	currentTeam: ObjectId;
	emailVerified: boolean;
	apiJwt?: string;
	token?: string;
	stripe?: AccountStripeData;
	oauth?: OAuthRecordType;
	permissions: Binary;
	onboarded: boolean;
};

export function AccountCollection(): any {
	return db.db().collection('accounts');
}

export async function getAccountById(userId: db.IdOrStr): Promise<Account> {
	return AccountCollection().findOne({
		_id: toObjectId(userId)
	});
}

export async function getAccountTeamMember(
	userId: db.IdOrStr,
	teamId: db.IdOrStr
): Promise<Account> {
	return AccountCollection().findOne({
		_id: toObjectId(userId),
		'orgs.teams.id': toObjectId(teamId)
	});
}

export function getAccountByEmail(email: string): Promise<Account> {
	return AccountCollection().findOne({
		email: email
	});
}

export function getAccountByOAuthOrEmail(
	oauthId: AccountOAuthId,
	provider: OAUTH_PROVIDER,
	email: string
): Promise<Account> {
	let query: any = {
		[`oauth.${provider}.id`]: oauthId
	};
	if (email != null && email.length > 0) {
		query = {
			$or: [query, { email /*, emailVerified: true*/ }] //Note: would cause duplicate accounts from oauth creation
		};
	}
	return AccountCollection().findOne(query);
}

export function setCurrentTeam(
	userId: db.IdOrStr,
	orgId: db.IdOrStr,
	teamId: db.IdOrStr
): Promise<Account> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$set: {
				currentOrg: toObjectId(orgId),
				currentTeam: toObjectId(teamId)
			}
		}
	);
}

export function verifyAccount(userId: db.IdOrStr): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$set: {
				emailVerified: true
			}
		}
	);
}

export function changeAccountPassword(userId: db.IdOrStr, passwordHash: string): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$set: {
				passwordHash
			}
		}
	);
}

export function pushAccountOrg(userId: db.IdOrStr, org: AccountOrg): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$push: {
				orgs: org
			}
		}
	);
}

export function pushAccountTeam(
	userId: db.IdOrStr,
	orgId: db.IdOrStr,
	team: AccountTeam
): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$push: {
				'orgs.$[org].teams': team
			}
		},
		{
			arrayFilters: [
				{
					'org.id': toObjectId(orgId)
				}
			]
		}
	);
}

//NOTE: will leave dangling orgs if removed from all teams in an org, but we filter these on the FE.
export function pullAccountTeam(
	userId: db.IdOrStr,
	orgId: db.IdOrStr,
	teamId: db.IdOrStr
): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$pull: {
				'orgs.$[org].teams': {
					id: toObjectId(teamId)
				}
			}
		},
		{
			arrayFilters: [
				{
					'org.id': toObjectId(orgId)
				}
			]
		}
	);
}

export function setAccountOauth(
	userId: db.IdOrStr,
	oauthId: AccountOAuthId,
	provider: OAUTH_PROVIDER
): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$set: {
				oauth: {
					[provider]: { id: oauthId }
				},
				emailVerified: true
			}
		}
	);
}

export function setStripePlan(stripeCustomerId: string, plan: SubscriptionPlan): Promise<any> {
	return AccountCollection().updateOne(
		{
			'stripe.stripeCustomerId': stripeCustomerId
		},
		{
			$set: {
				'stripe.stripePlan': plan
			}
		}
	);
}

export function setStripeCustomerId(userId: db.IdOrStr, stripeCustomerId: string): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$set: {
				'stripe.stripeCustomerId': stripeCustomerId
			}
		}
	);
}

export function updateStripeCustomer(
	stripeCustomerId: string,
	update: Partial<AccountStripeData>
): Promise<any> {
	return AccountCollection().updateOne(
		{
			'stripe.stripeCustomerId': stripeCustomerId
		},
		{
			$set: {
				...(update.stripeCustomerId ? { 'stripe.stripeCustomerId': update.stripeCustomerId } : {}),
				...(update.stripeEndsAt ? { 'stripe.stripeEndsAt': update.stripeEndsAt } : {}),
				...(update.stripeCancelled != null
					? { 'stripe.stripeCancelled': update.stripeCancelled }
					: {}),
				...(update.stripePlan ? { 'stripe.stripePlan': update.stripePlan } : {}),
				...(update.stripeAddons ? { 'stripe.stripeAddons': update.stripeAddons } : {}),
				...(update.stripeTrial != null ? { 'stripe.stripeTrial': update.stripeTrial } : {})
			}
		}
	);
}

export function setAccountPermissions(userId: db.IdOrStr, permissions: Permission): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$set: {
				permissions: new Binary(permissions.array)
			}
		}
	);
}

export function addAccount(account: Account): Promise<InsertResult> {
	return AccountCollection().insertOne(account);
}

export function updateTeamOwnerInAccounts(
	orgId: db.IdOrStr,
	teamId: db.IdOrStr,
	newOwnerId: db.IdOrStr
): Promise<any> {
	return AccountCollection().updateMany(
		{
			'orgs.id': toObjectId(orgId),
			'orgs.teams.id': toObjectId(teamId)
		},
		{
			$set: {
				'orgs.$[org].teams.$[team].ownerId': toObjectId(newOwnerId)
			}
		},
		{
			arrayFilters: [{ 'org.id': toObjectId(orgId) }, { 'team.id': toObjectId(teamId) }]
		}
	);
}

export function updateRoleAndMarkOnboarded(userId: db.IdOrStr, role: string): Promise<any> {
	return AccountCollection().updateOne(
		{
			_id: toObjectId(userId)
		},
		{
			$set: {
				role,
				onboarded: true
			}
		}
	);
}
