'use strict';

import { MongoClient, ObjectId } from 'mongodb';
const dev = process.env.NODE_ENV !== 'production';

export type InsertResult = {
	acknowledged?: boolean;
	insertedId?: ObjectId;
}

export type IdOrStr = string | ObjectId;

let _client;

export async function connect() {		
	_client = new MongoClient(process.env.DB_URL);
	dev && console.log('connecting to mongodb');
	await _client.connect();
}

export function client(): MongoClient {
	return _client;
}

export function db() {
	return _client && _client.db();
}
