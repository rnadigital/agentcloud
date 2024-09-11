import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { Collection, InsertOneResult } from 'mongodb';
import { Asset } from 'struct/asset'; // Ensure this path is correct
import { CollectionName } from 'struct/db';

import * as db from './index';

const log = debug('webapp:db:assets');

// Function to get the assets collection
export function assetCollection(): Collection<Asset> {
	return db.db().collection<Asset>('assets');
}

// Function to add a new asset
export async function addAsset(asset: Asset): Promise<InsertOneResult<Asset>> {
	return assetCollection().insertOne(asset);
}

// Function to retrieve an asset by its ID
export async function getAssetById(assetId: db.IdOrStr, teamId: db.IdOrStr): Promise<Asset | null> {
	return assetCollection().findOne({
		_id: toObjectId(assetId),
		teamId: toObjectId(teamId)
	});
}

//Function to link an asset to an agent
export async function attachAssetToObject(
	assetId: db.IdOrStr,
	linkedId: db.IdOrStr,
	linkedCollection: CollectionName
): Promise<Asset> {
	return assetCollection().findOneAndUpdate(
		{
			_id: toObjectId(assetId),
			linkedToId: null,
			linkedCollection: null
		},
		{
			$set: {
				linkedToId: toObjectId(linkedId),
				linkedCollection: linkedCollection
			}
		}
	);
}

// Function to update an asset by its ID
export async function updateAsset(
	assetId: db.IdOrStr,
	updateData: Partial<Asset>
): Promise<boolean> {
	const result = await assetCollection().updateOne(
		{ _id: toObjectId(assetId) },
		{ $set: updateData }
	);
	return result.matchedCount > 0;
}

// Function to delete an asset by its ID
export async function deleteAssetById(assetId: db.IdOrStr): Promise<boolean> {
	const result = await assetCollection().deleteOne({
		_id: toObjectId(assetId)
	});
	return result.deletedCount > 0;
}
