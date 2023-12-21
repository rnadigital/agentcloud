'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';
import { randomBytes } from 'crypto';

export enum VerificationTypes {
	VERIFY_EMAIL = 'email',
	CHANGE_PASSWORD = 'change_password',
	TEAM_INVITE = 'team_invite',
}

export type VerificationType = VerificationTypes; //TODO: add whatever types we need here

export type Verification = {
	_id?: ObjectId;
	token: string;
	accountId: ObjectId;
	type: VerificationType;
}

export function VerificationCollection() {
	return db.db().collection('verifications');
}

export async function addVerification(accountId: db.IdOrStr, type: VerificationType): Promise<string> {
	const randomBytesHex: string = await randomBytes(64).toString('hex');
	await VerificationCollection().insertOne({
		token: randomBytesHex,
		accountId: toObjectId(accountId),
		type,
	});
	return randomBytesHex;
}

export function getAndDeleteVerification(token: string, type: VerificationType): Promise<any> {
	return VerificationCollection().findOneAndDelete({ //findOneAndDelete to be atomic, not allow double use
		token,
		type,
	});
}
