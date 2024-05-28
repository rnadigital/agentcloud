'use strict';

import { dynamicResponse } from '@dr';
import { addAsset } from 'db/asset';
import toObjectId from 'lib/misc/toobjectid';
import withLogging from 'lib/misc/withlogging';
import { ObjectId } from 'mongodb';
import path from 'path';
import StorageProviderFactory from 'storage/index';
import { Asset } from 'struct/asset';

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
		uploadedAt: new Date(),
	};

	const wrappedAddAsset = withLogging(addAsset, res.locals?.account?._id);
	const addedAsset = await wrappedAddAsset(assetBody);
	const storageProvider = StorageProviderFactory.getStorageProvider();
	await storageProvider.addFile(filename, uploadedFile, uploadedFile.mimetype, true);

	return dynamicResponse(req, res, 200, assetBody);

}

//TODO: get, edit, delete, etc asset api
