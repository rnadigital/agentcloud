'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';

export type CredentialPlatform = 'OPENAI' | 'AZURE'; //TODO: more

export type Credential = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	platform: CredentialPlatform;
	data: {
		key?: string;
		//TODO: more
	};
    name: string;
    createdDate: Date;
}

export function CredentialCollection() {
	return db.db().collection('credentials');
}

export function getCredentialById(teamId: db.IdOrStr, credentialId: db.IdOrStr): Promise<Credential> {
	return CredentialCollection().findOne({
		_id: toObjectId(credentialId),
		teamId: toObjectId(teamId),
	});
}

export function getCredentialsByTeam(teamId: db.IdOrStr): Promise<Credential> {
	return CredentialCollection().find({
		teamId: toObjectId(teamId),
	}).toArray();
}

export async function addCredential(credential: Credential): Promise<db.InsertResult> {
	return CredentialCollection().insertOne(credential);
}

export function deleteCredentialById(teamId: db.IdOrStr, credentialId: db.IdOrStr): Promise<any> {
	return CredentialCollection().deleteOne({
		_id: toObjectId(credentialId),
		teamId: toObjectId(teamId),
	});
}
