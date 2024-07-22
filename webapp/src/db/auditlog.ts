'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { InsertOneResult } from 'mongodb';
import { Log } from 'struct/auditlog'; // Adjust the import path as necessary

// Function to get the logs collection
export function LogsCollection() {
	return db.db().collection<Log>('logs');
}

// Function to add a new log entry
export async function addLog(logEntry: Log): Promise<InsertOneResult<Log>> {
	return LogsCollection().insertOne(logEntry);
}

// Function to retrieve a log by its ID
export async function getLogById(logId: db.IdOrStr): Promise<Log | null> {
	return LogsCollection().findOne({
		_id: toObjectId(logId)
	});
}

// Function to delete a log by its ID
export async function deleteLogById(logId: db.IdOrStr): Promise<boolean> {
	const result = await LogsCollection().deleteOne({
		_id: toObjectId(logId)
	});
	return result.deletedCount > 0;
}
