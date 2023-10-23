'use strict';

import { ObjectId } from 'mongodb';
import { VerificationTypes, addVerification, getAndDeleteVerification } from '../db/verification';
import { dynamicResponse } from '../util';

export async function integrationData(req, res, _next) {
	//const data = await calling an api
	return {
		csrf: req.csrfToken(),
		integrations: [], //TODO: return integrations list
	};
};

/**
 * GET /integrations
 * account page html
 */
export async function integrationsPage(app, req, res, next) {
	const data = await integrationData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/integrations');
}

/**
 * GET /integrations.json
 * account page json data
 */
export async function integrationsJson(req, res, next) {
	const data = await integrationData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * POST /forms/integrations/add
 * login
 */
export async function addIntegrationApi(req, res) {
	const accountId = res.locals.account._id;
	return dynamicResponse(req, res, 403, { error: 'Not implemented' });
}
