'use strict';

import debug from 'debug';
const log = debug('webapp:db');
import { MongoClient, ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';

export type IdOrStr = string | ObjectId;

let _client: MongoClient | null = null;

export async function connect() {
	if (!_client) {
		_client = new MongoClient(process.env.DB_URL, {
			maxPoolSize: 10
		});
		log('connecting to mongodb');
		await _client.connect();
	} else {
		log('mongodb connection already established');
	}
}

export function client(): MongoClient {
	return _client;
}

export function db() {
	return client() && client().db();
}
