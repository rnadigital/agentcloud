'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { App } from 'struct/app'; // Adjusted the import path to match App struct
import { InsertResult } from 'struct/db';

const CREW_JOIN_STAGES = [
	{
		$lookup: {
			from: 'crews', // The collection to join.
			localField: 'crewId', // The field from the input documents.
			foreignField: '_id', // The field from the documents of the "from" collection.
			as: 'crewInfo' // The output array field.
		}
	},
	{
		$unwind: {
			path: '$crewInfo',
			preserveNullAndEmptyArrays: true // Optional, to keep apps without a crew.
		}
	},
	{
		$set: { // or $addFields
			crew: '$crewInfo' // Rename "crewInfo" to "crew".
		}
	},
	{
		$project: {
			crewInfo: 0 // Optionally remove the temporary "crewInfo" field.
		}
	}
];

export function AppCollection(): any {
	return db.db().collection('apps'); // Changed collection to 'apps'
}

export function getAppById(teamId: db.IdOrStr, appId: db.IdOrStr): Promise<App> {
	const res = AppCollection().aggregate([
		{
			$match: {
				_id: toObjectId(appId),
				teamId: toObjectId(teamId),
			}
		},
		...CREW_JOIN_STAGES
	]).toArray();
	return res.then(docs => docs.length > 0 ? docs[0] : null);
}

export function getAppByCrewId(teamId: db.IdOrStr, crewId: db.IdOrStr): Promise<App> {
	const res = AppCollection().findOne({crewId});
	return res.then(docs => docs.length > 0 ? docs[0] : null);
}

export function getAppsByTeam(teamId: db.IdOrStr): Promise<App[]> {
	return AppCollection().aggregate([
		{
			$match: {
				teamId: toObjectId(teamId),
			}
		},
		...CREW_JOIN_STAGES
	]).toArray();
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
