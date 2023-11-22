'use strict';

import { getToolsByTeam, addTool } from '../db/tool';
import { getCredentialsByTeam } from '../db/credential';
import { dynamicResponse } from '../util';
import toObjectId from '../lib/misc/toobjectid';
import { ToolType } from '../lib/struct/tools';
import toSnakeCase from '../lib/misc/tosnakecase';

export async function toolsData(req, res, _next) {
	const [tools, credentials] = await Promise.all([
		getToolsByTeam(res.locals.account.currentTeam),
		getCredentialsByTeam(res.locals.account.currentTeam),
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		credentials,
	};
}

/**
 * GET /[resourceSlug]/tools
 * tool page html
 */
export async function toolsPage(app, req, res, next) {
	const data = await toolsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${res.locals.account.currentTeam}/tools`);
}

/**
 * GET /[resourceSlug]/tools.json
 * team tools json data
 */
export async function toolsJson(req, res, next) {
	const data = await toolsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

//TODO: add tool form, delete, etc
export async function addToolApi(req, res, next) {

	const { name, type, data, credentialId }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0
		|| !type || typeof type !== 'string' || type.length === 0 // TODO: or is not one of valid types
		// || !credentialId || typeof credentialId !== 'string' || credentialId.length !== 24
		|| !data) { //TODO: validation
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await addTool({
		orgId: res.locals.account.currentOrg,
		teamId: res.locals.account.currentTeam,
	    name,
	    functionName: toSnakeCase(name), //TODO: add unique index? or enforce unique on applying to agent
	 	type: type as ToolType,
		data,
	});

	return dynamicResponse(req, res, 302, { redirect: `/${res.locals.account.currentTeam}/tools` });

}
