'use strict';

import { getToolsByTeam } from '../db/tool';
import { dynamicResponse } from '../util';
import toObjectId from '../lib/misc/toobjectid';

export async function toolsData(req, res, _next) {
	const tools = await getToolsByTeam(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		tools,
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
