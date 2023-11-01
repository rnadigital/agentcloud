'use strict';

import { getGroupById, getGroupsByTeam } from '../db/group';
import { getAgentsByTeam } from '../db/agent';
import { dynamicResponse } from '../util';

export async function groupsData(req, res, _next) {
	const groups = await getGroupsByTeam(res.locals.account.currentTeam); //TODO: change data fetched here to list of groups
	const teamAgents = await getAgentsByTeam(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		groups,
		hasAgents: teamAgens.length > 0,
	};
}

export async function groupData(req, res, _next) {
	const groupData = await getGroupById(res.locals.account.currentTeam, req.params.groupId);
	const teamAgents = await getAgentsByTeam(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		groupData,
		hasAgents: teamAgens.length > 0,
	};
}

/**
 * GET /[resourceSlug]/groups
 * group page html
 */
export async function groupsPage(app, req, res, next) {
	const data = await groupsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/[resourceSlug]/groups');
}

/**
 * GET /[resourceSlug]/groups.json
 * group page json data
 */
export async function groupsJson(req, res, next) {
	const data = await groupsData(req, res, next);//TODO: change data used here
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/group/add
 * group page json data
 */
export async function groupAddPage(app, req, res, next) {
	const data = await groupsData(req, res, next); //needed? also see agents controller
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/[resourceSlug]/group/add');
}

/**
 * GET /[resourceSlug]/group/[groupId]/edit
 * group page html
 */
export async function groupEditPage(app, req, res, next) {
	const data = await groupData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/[resourceSlug]/group/[groupId]/edit');
}
