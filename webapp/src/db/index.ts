'use strict';

import debug from 'debug';
const log = debug('webapp:db');
import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

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

export async function connectMongooseDB() {
	try {
		await mongoose.connect(process.env.DB_URL);
		log('Mongoose connected successfully');
	} catch (error) {
		log('Mongoose connection error:', error);
		process.exit(1);
	}
}
