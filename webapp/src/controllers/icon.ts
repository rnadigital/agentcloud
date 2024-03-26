'use strict';

import { dynamicResponse } from '@dr';
import { addIcon } from 'db/icon';
import { deleteFile, uploadFile } from 'lib/google/gcs';
import toObjectId from 'lib/misc/toobjectid';
import { ObjectId } from 'mongodb';
import path from 'path';

export async function uploadIconApi(req, res) {

	if (!req.files || Object.keys(req.files).length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const uploadedFile = req.files.file;
	let fileExtension = path.extname(uploadedFile.name);
	if (!fileExtension) {
		return dynamicResponse(req, res, 400, { error: 'Invalid file extension' });
	}

	const newIconId = new ObjectId();
	const iconFile = req.files.file;
	const filename = `${newIconId.toString()}${fileExtension}`;
	const iconData = {
		_id: newIconId,
		orgId: toObjectId(res.locals.matchingOrg.id),
		teamId: toObjectId(req.params.resourceSlug),
		filename: iconFile.name,
		mimeType: iconFile.mimetype,
		uploadedAt: new Date(),
	};

	const addedIcon = await addIcon(iconData);
	await uploadFile(filename, iconFile);

	return dynamicResponse(req, res, 200, { _id: addedIcon.insertedId });

}

//TODO: delete icon api
