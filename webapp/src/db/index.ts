'use strict';

import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { createLogger } from 'utils/logger';

export type IdOrStr = string | ObjectId;
const log = createLogger('webapp:db');

let _client: MongoClient | null = null;

export async function connect() {
	if (!_client) {
		_client = new MongoClient(process.env.DB_URL, {
			maxPoolSize: 10
		});
		log.info('connecting to mongodb');
		await _client.connect();
	} else {
		log.info('mongodb connection already established');
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
		log.info('Mongoose connected successfully');
	} catch (error) {
		log.error('Mongoose connection error:', error);
		process.exit(1);
	}
}
