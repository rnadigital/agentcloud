'use strict';

import debug from 'debug';
const log = debug('webapp:db');
import { MongoClient, ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';

export type IdOrStr = string | ObjectId;

let _client;

export async function connect() {
	_client = new MongoClient(process.env.DB_URL);
	log('connecting to mongodb');
	await _client.connect();
}

export function client(): MongoClient {
	return _client;
}

export function db() {
	return client() && client().db();
}
