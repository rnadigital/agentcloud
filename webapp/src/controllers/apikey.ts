'use strict';

import { dynamicResponse } from '@dr';
import { addKey, deleteKey, getKeyById, getKeysByOwner, incrementVersion } from 'db/apikey';

export async function keysData(req, res, _next) {
	const keys = await getKeysByOwner(res.locals.account._id);

	return {
		csrf: req.csrfToken(),
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
	return app.render(req, res, `/token/add`);
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
