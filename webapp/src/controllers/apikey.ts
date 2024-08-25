'use strict';

import { dynamicResponse } from '@dr';
import {
	addKey,
	addTokenToKey,
	deleteKey,
	getKeyById,
	getKeysByOwner,
	incrementVersion
} from 'db/apikey';
import jwt from 'jsonwebtoken';
import { chainValidations } from 'utils/validationutils';

export async function keysData(req, res, _next) {
	const keys = await getKeysByOwner(res.locals.account?._id);

	return {
		keys
	};
}

/**
 * GET /apikeys
 *
 */
export async function apiKeysPage(app, req, res, next) {
	const data = await keysData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/apikeys`);
}

/**
 * GET /apikeys.json
 */
export async function apikeysJson(req, res, next) {
	const data = await keysData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function keyData(req, res, next) {
	const key = await getKeyById(res.locals.account._id, req.params.keyId);
	return {
		csrf: req.csrfToken(),
		key
	};
}

/**
 * GET /apikey/add
 * user page html
 */
export async function keyAddPage(app, req, res, next) {
	const data = await keysData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/apikey/add`);
}

/**
 * GET /apikey/[keyId]/edit
 */

export async function keyEditPage(app, req, res, next) {
	const data = await keyData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/apikey/${data.key._id}/edit`);
}

/**
 * GET /apikey/[keyId].json
 * user page html
 */
export async function keyJson(req, res, next) {
	const data = await keyData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function addKeyApi(req, res, next) {
	const { name, description, expirationDays, ownerId } = req.body;

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'expirationDays', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'ownerId', validation: { notEmpty: true } }
		],
		{
			name: 'Name',
			expirationDays: 'Number of days before expiry',
			ownerId: 'Id of the creator of the key'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	//generate expiration date
	const epxirationDate = new Date();
	if (expirationDays === 'never') {
		epxirationDate.setDate(epxirationDate.getDate() + 365); //need a better way to set never
	} else {
		const numOfDays = parseInt(expirationDays);
		epxirationDate.setDate(epxirationDate.getDate() + numOfDays);
	}

	//add key to db
	const addedKey = await addKey({
		name: name,
		description: description,
		expirationDate: epxirationDate,
		ownerId: ownerId
	});

	//generate key for the user
	const keyToken = jwt.sign(
		{ keyId: addedKey._id, ownerId: ownerId, version: addedKey.version },
		process.env.JWT_SECRET
	);

	//add the token back into the key object
	const updatedKey = await addTokenToKey(addedKey._id, keyToken);
	console.log('updatedKey', updatedKey);

	return dynamicResponse(req, res, 302, {
		keyId: addedKey._id,
		ownerId: addedKey.ownerId,
		token: keyToken,
		redirect: '/apikeys'
	});
}
