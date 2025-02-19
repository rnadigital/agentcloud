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
import toObjectId from 'misc/toobjectid';
import { chainValidations } from 'utils/validationutils';

export async function keysData(req, res, _next) {
	const keys = await getKeysByOwner(res?.locals?.account?._id);
	return {
		keys,
		csrf: req.csrfToken()
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
		key,
		csrf: req.csrfToken()
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
	let epxirationDate = new Date();
	if (expirationDays === 'never') {
		epxirationDate = null;
	} else {
		const numOfDays = parseInt(expirationDays);
		epxirationDate.setDate(epxirationDate.getDate() + numOfDays);
	}

	//add key to db
	const addedKey = await addKey({
		name: name,
		description: description,
		expirationDate: epxirationDate,
		ownerId: toObjectId(ownerId)
	});

	//generate key for the user
	const keyToken = jwt.sign(
		{ keyId: addedKey?.insertedId, accountId: ownerId, version: 0 },
		process.env.JWT_SECRET,
		expirationDays == 'never' ? {} : { expiresIn: `${expirationDays}d` }
	);

	//add the token back into the key object
	const updatedKey = await addTokenToKey(addedKey?.insertedId, keyToken);

	return dynamicResponse(req, res, 302, {
		keyId: addedKey.insertedId,
		ownerId: ownerId,
		token: keyToken,
		redirect: '/apikeys'
	});
}

export async function deleteKeyApi(req, res, next) {
	const { keyId, ownerId } = req.body;

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'keyId', validation: { notEmpty: true } },
			{ field: 'ownerId', validation: { notEmpty: true } }
		],
		{ keyId: 'Key', ownerId: 'Key Creator' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	await deleteKey(toObjectId(ownerId), toObjectId(keyId));

	return dynamicResponse(req, res, 302, {
		//redirect: `/apikeys`
	});
}

export async function incrementKeyApi(req, res, next) {
	const { keyId, ownerId } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'keyId', validation: { notEmpty: true } }],
		{ keyId: 'Key' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	await incrementVersion(toObjectId(ownerId), toObjectId(keyId));

	const modifiedKey = await getKeyById(toObjectId(ownerId), toObjectId(keyId));

	let expireSeconds;
	if (modifiedKey?.expirationDate === null) {
		expireSeconds = null;
	} else {
		const expireDate = new Date(modifiedKey?.expirationDate).getSeconds();
		const today = new Date().getSeconds();
		expireSeconds = expireDate - today;
	}

	const newToken = jwt.sign(
		{ keyId: modifiedKey?._id, ownerId: modifiedKey?.ownerId, version: modifiedKey?.version },
		process.env.JWT_SECRET,
		expireSeconds === null ? {} : { expiresIn: `${expireSeconds}s` }
	);

	await addTokenToKey(toObjectId(modifiedKey?._id), newToken);

	return dynamicResponse(req, res, 302, {});
}
