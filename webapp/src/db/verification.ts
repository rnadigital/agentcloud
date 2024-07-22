'use strict';

import { randomBytes } from 'crypto';
import * as db from 'db/index';
import { ObjectId } from 'mongodb';

import toObjectId from '../lib/misc/toobjectid';

export enum VerificationTypes {
	VERIFY_EMAIL = 'email',
	CHANGE_PASSWORD = 'change_password',
	TEAM_INVITE = 'team_invite'
}

export type VerificationType = VerificationTypes;

export type Verification = {
	_id?: ObjectId;
	token: string;
	accountId: ObjectId;
	type: VerificationType;
};

export function VerificationCollection(): any {
	return db.db().collection('verifications');
}

export async function addVerification(
	accountId: db.IdOrStr,
	type: VerificationType
): Promise<string> {
	const randomBytesHex: string = await randomBytes(64).toString('hex');
	await VerificationCollection().insertOne({
		token: randomBytesHex,
		accountId: toObjectId(accountId),
		type
	});
	return randomBytesHex;
}

export function getAndDeleteVerification(token: string, type: VerificationType): Promise<any> {
	// Note: findOneAndDelete to be atomic, prevent double use
	return VerificationCollection().findOneAndDelete({
		token,
		type
	});
}
