'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';
import { OAUTH_PROVIDER } from 'struct/oauth';

type AccountTeam = {
	id: ObjectId;
	name: string;
	airbyteWorkspaceId?: string;
}

type AccountOrg = {
	id: ObjectId;
	name: string;
	teams: AccountTeam[];
}

export type AccountOAuthId = string | number; // <- Proof that typescript is pointless busywork

export type AccountOAuthData = {
	id: AccountOAuthId,
	// potentially more stuff here later...
}

export type OAuthRecordType = Partial<Record<OAUTH_PROVIDER,AccountOAuthData>>;

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
	//TODO: move these stripe things to a "stripe" key
	stripeCustomerId?: string;
	stripeEndsAt?: number;
	stripeCancelled?: boolean;
	oauth?: OAuthRecordType,
}

export function AccountCollection() {
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
			stripeCustomerId,
		}
	});
}

export function updateStripeCustomer(stripeCustomerId: string, stripeEndsAt: number, stripeCancelled?: boolean): Promise<any> {
	console.log('updateStripeCustomer', stripeCustomerId, stripeEndsAt);
	return AccountCollection().updateOne({
		stripeCustomerId,
	}, {
		$set: {
			stripeCustomerId: stripeCustomerId,
			stripeEndsAt: stripeEndsAt,
			stripeCancelled: stripeCancelled || false,
		}
	});
}

export function unsetStripeCustomer(stripeCustomerId: string): Promise<any> {
	return AccountCollection().updateOne({
		stripeCustomerId,
	}, {
		$unset: {
			stripeCustomerId: '',
			stripeEndsAt: '',
		}
	});
}

export function addAccount(account: Account): Promise<db.InsertResult> {
	return AccountCollection().insertOne(account);
}
