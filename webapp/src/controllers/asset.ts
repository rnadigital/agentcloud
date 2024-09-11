'use strict';

import { dynamicResponse } from '@dr';
import { addAsset, attachAssetToObject, getAssetById } from 'db/asset';
import toObjectId from 'lib/misc/toobjectid';
import { ObjectId } from 'mongodb';
import path from 'path';
import StorageProviderFactory from 'storage/index';
import { Asset } from 'struct/asset';
import { CollectionName } from 'struct/db';

export async function uploadAssetApi(req, res) {
	if (!req.files || Object.keys(req.files).length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const uploadedFile = req.files.file;
	let fileExtension = path.extname(uploadedFile.name);
	if (!fileExtension) {
		return dynamicResponse(req, res, 400, { error: 'Invalid file extension' });
	}

	const newAssetId = new ObjectId();
	const filename = `${newAssetId.toString()}${fileExtension}`;
	const assetBody: Asset = {
		_id: newAssetId,
		orgId: toObjectId(res.locals.matchingOrg.id),
		teamId: toObjectId(req.params.resourceSlug),
		filename,
		originalFilename: uploadedFile.name,
		mimeType: uploadedFile.mimetype,
		linkedCollection: null,
		linkedToId: null,
		uploadedAt: new Date()
	};

	await addAsset(assetBody);
	const storageProvider = StorageProviderFactory.getStorageProvider();
	await storageProvider.uploadLocalFile(filename, uploadedFile, uploadedFile.mimetype, true);

	return dynamicResponse(req, res, 200, assetBody);
}

export async function cloneAssetInStorageProvider(
	iconId: ObjectId,
	cloning: boolean,
	newObjectId: ObjectId,
	collectionType: CollectionName,
	resourceSlug
) {
	if (!iconId) {
		return null; //null return when no iconId
	}
	let attachedIconToAgent = await attachAssetToObject(iconId, newObjectId, collectionType);
	if (attachedIconToAgent && cloning) {
		return attachedIconToAgent; //this is the case where you're not actually cloning, just adding a new agent
	}

	const foundAsset = await getAssetById(iconId, resourceSlug);

	if (!foundAsset) {
		return null; //handle case when there isn't a found assetId for the given iconId
	}

	//if we get to here then all the checks are passed
	const fileExtension = path.extname(foundAsset.filename);

	const newAssetId = new ObjectId();
	const newFileName = `${newAssetId.toString()}${fileExtension}`;
	const assetBody: Asset = {
		...foundAsset,
		_id: newAssetId,
		filename: newFileName,
		linkedCollection: CollectionName.Agents,
		linkedToId: newObjectId
	};
	const storageProvider = StorageProviderFactory.getStorageProvider();
	await storageProvider.cloneFile(foundAsset.filename, newFileName, true);
	addAsset(assetBody);
	return assetBody;
}
//TODO: get, edit, delete, etc asset api
