'use strict';

import * as db from 'db/index';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';
import { OAUTH_PROVIDER } from 'struct/oauth';

import toObjectId from '../lib/misc/toobjectid';

export type AccountTeam = {
	id: ObjectId;
	name: string;
	airbyteWorkspaceId?: string;
}

export type AccountOrg = {
	id: ObjectId;
	name: string;
	teams: AccountTeam[];
}

// OAuth data for account
export type AccountOAuthId = string | number;
export type AccountOAuthData = {
	id: AccountOAuthId,
	// potentially more stuff here later...
}
export type OAuthRecordType = Partial<Record<OAUTH_PROVIDER,AccountOAuthData>>;

// Stripe data for account
export type AccountStripeData = {
	stripeCustomerId?: string;
	stripeEndsAt?: number;
	stripeCancelled?: boolean;
}

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
	oauth?: OAuthRecordType,
}

export function AccountCollection(): any {
	return db.db().collection('accounts');
}

export function getAccountById(userId: db.IdOrStr): Promise<Account> {
	return AccountCollection().findOne({
		_id: toObjectId(userId)
	});
}

export function getAccountByEmail(email: string): Promise<Account> {
	return AccountCollection().findOne({
		email: email,
	});
}

export function getAccountByOAuthOrEmail(oauthId: AccountOAuthId, provider: OAUTH_PROVIDER, email: string): Promise<Account> {
	let query: any = {
		[`oauth.${provider}.id`]: oauthId,
	};
	if (email != null && email.length > 0) {
		query = {
			$or: [
				query,
				{ email, emailVerified: true },
			]
		};
	}
	return AccountCollection().findOne(query);
}

export function setCurrentTeam(userId: db.IdOrStr, orgId: db.IdOrStr, teamId: db.IdOrStr): Promise<Account> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$set: {
			currentOrg: toObjectId(orgId),
			currentTeam: toObjectId(teamId),
		},
	});
}

export function verifyAccount(userId: db.IdOrStr): Promise<any> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$set: {
			emailVerified: true,
		}
	});
}

export function changeAccountPassword(userId: db.IdOrStr, passwordHash: string): Promise<any> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$set: {
			passwordHash,
		}
	});
}

export function pushAccountOrg(userId: db.IdOrStr, org: AccountOrg): Promise<any> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$push: {
			orgs: org
		}
	});
}

export function pushAccountTeam(userId: db.IdOrStr, orgId: db.IdOrStr, team: AccountTeam): Promise<any> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$push: {
			'orgs.$[org].teams': team
		}
	}, {
		arrayFilters: [{
			'org.id': toObjectId(orgId)
		}]
	});
}

export function setAccountOauth(userId: db.IdOrStr, oauthId: AccountOAuthId, provider: OAUTH_PROVIDER): Promise<any> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$set: {
			oauth: {
				[provider]: { id: oauthId },
			},
		}
	});
}

export function setStripeCustomerId(userId: db.IdOrStr, stripeCustomerId: string): Promise<any> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$set: {
			'stripe.stripeCustomerId': stripeCustomerId,
		}
	});
}

export function updateStripeCustomer(stripeCustomerId: string, stripeEndsAt: number, stripeCancelled?: boolean): Promise<any> {
	console.log('updateStripeCustomer', stripeCustomerId, stripeEndsAt);
	return AccountCollection().updateOne({
		stripeCustomerId,
	}, {
		$set: {
			'stripe.stripeCustomerId': stripeCustomerId,
			'stripe.stripeEndsAt': stripeEndsAt,
			'stripe.stripeCancelled': stripeCancelled || false,
		}
	});
}

export function unsetStripeCustomer(stripeCustomerId: string): Promise<any> {
	return AccountCollection().updateOne({
		stripeCustomerId,
	}, {
		$unset: {
			'stripe.stripeCustomerId': '',
			'stripe.stripeEndsAt': '',
		}
	});
}

export function addAccount(account: Account): Promise<InsertResult> {
	return AccountCollection().insertOne(account);
}
