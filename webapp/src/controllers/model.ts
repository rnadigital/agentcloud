'use strict';

import { getModelsByTeam } from 'db/model';
import dotenv from 'dotenv';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';

import { getCredentialById, getCredentialsById, getCredentialsByTeam } from '../db/credential';
import { dynamicResponse } from '../util';
dotenv.config({ path: '.env' });

export async function modelsData(req, res, _next) {
	const [models, credentials] = await Promise.all([
		getModelsByTeam(req.params.resourceSlug),
		getCredentialsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		models,
		credentials,
	};
}

/**
* GET /[resourceSlug]/models
* models page html
*/
export async function modelsPage(app, req, res, next) {
	const data = await modelsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/models`);
}

/**
* GET /[resourceSlug]/models.json
* models json data
*/
export async function modelsJson(req, res, next) {
	const data = await modelsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
* GET /[resourceSlug]/model/add
* models add page html
*/
export async function modelAddPage(app, req, res, next) {
	const data = await modelsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/model/add`);
}

export async function modelAddApi(req, res, next) {
	//TODO
	return dynamicResponse(req, res, 200, { });
}
