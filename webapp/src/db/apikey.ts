'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { APIKey } from 'struct/apikey';
import { InsertResult } from 'struct/db';

export function APIKeyCollection(): any {
	return db.db().collection('apikeys');
}

export async function addKey(key: APIKey): Promise<InsertResult> {
	return APIKeyCollection().insertOne(key);
}

export function deleteKey(ownerId: db.IdOrStr, keyId: db.IdOrStr): Promise<any> {
	return APIKeyCollection().deleteOne({
		_id: toObjectId(keyId),
		ownerId: toObjectId(ownerId)
	});
}

export function addTokenToKey(keyId: db.IdOrStr, token: string): Promise<APIKey> {
	return APIKeyCollection().updateOne(
		{
			_id: toObjectId(keyId)
		},
		{
			$set: {
				token: token
			}
		}
	);
}

export function getKeyById(ownerId: db.IdOrStr, keyId: db.IdOrStr): Promise<APIKey> {
	return APIKeyCollection().findOne({
		_id: toObjectId(keyId),
		ownerId: toObjectId(ownerId)
	});
}

export function getKeysByOwner(ownerId: db.IdOrStr): Promise<APIKey[]> {
	return APIKeyCollection()
		.find({
			ownerId: toObjectId(ownerId)
		})
		.project({ version: 0 })
		.toArray();
}

export async function incrementVersion(ownerId: db.IdOrStr, keyId: db.IdOrStr): Promise<any> {
	return APIKeyCollection().updateOne(
		{
			_id: toObjectId(keyId),
			ownerId: toObjectId(ownerId)
		},
		{
			$inc: {
				version: 1
			}
		}
	);
}
