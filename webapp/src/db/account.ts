'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';
import { OAUTH_PROVIDER } from '../controllers/oauth';

type AccountTeam = {
	id: ObjectId;
	name: string;
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

export function getAccountByOAuth(oauthId: AccountOAuthId, provider: OAUTH_PROVIDER): Promise<Account> {
	return AccountCollection().findOne({
		[`oauth.${provider}.id`]: oauthId,
	});
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

export function setAccountToken(userId: db.IdOrStr, token: string): Promise<any> {
	return AccountCollection().updateOne({
		_id: toObjectId(userId)
	}, {
		$set: {
			token,
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
