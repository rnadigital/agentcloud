'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { App } from 'struct/app'; // Adjusted the import path to match App struct
import { InsertResult } from 'struct/db';

export function AppCollection(): any {
	return db.db().collection('apps'); // Changed collection to 'apps'
}

export function getAppById(teamId: db.IdOrStr, appId: db.IdOrStr): Promise<App> {
	return AppCollection().findOne({
		_id: toObjectId(appId),
		teamId: toObjectId(teamId),
	});
}

export function getAppsByTeam(teamId: db.IdOrStr): Promise<App[]> {
	return AppCollection().find({
		teamId: toObjectId(teamId),
	}).toArray();
}

export function getAppsByOrg(orgId: db.IdOrStr): Promise<App[]> { // Changed parameter name to orgId for clarity
	return AppCollection().find({
		orgId: toObjectId(orgId), // Adjusted the query to match the App struct
	}).toArray();
}

export async function addApp(app: App): Promise<InsertResult> {
	return AppCollection().insertOne(app);
}

export async function updateApp(teamId: db.IdOrStr, appId: db.IdOrStr, app: Partial<App>): Promise<InsertResult> {
	return AppCollection().updateOne({
		_id: toObjectId(appId),
		teamId: toObjectId(teamId),
	}, {
		$set: app,
	});
}

export function deleteAppById(teamId: db.IdOrStr, appId: db.IdOrStr): Promise<any> {
	return AppCollection().deleteOne({
		_id: toObjectId(appId),
		teamId: toObjectId(teamId),
	});
}
