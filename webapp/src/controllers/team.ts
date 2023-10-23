'use strict';

import { getTeamById } from '../db/team';
import { getSessionsByTeam } from '../db/session';
import { setCurrentTeam } from '../db/account';
import { dynamicResponse } from '../util';

export async function teamHomeData(req, res, _next) {
	const sessions = await getSessionsByTeam(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		sessions,
	};
}

/**
 * GET /[resourceSlug]/home
 * home page html
 */
export async function homePage(app, req, res, next) {
	const data = await teamHomeData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/[resourceSlug]/home');
}

/**
 * GET /[resourceSlug]/home.json
 * team home json data
 */
export async function homeJson(req, res, next) {
	const data = await teamHomeData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function teamData(req, res, _next) {
	const teamData = await getTeamById(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		teamData: teamData,
	};
}

/**
 * GET /[resourceSlug]/tools
 * team page html
 */
export async function toolsPage(app, req, res, next) {
	const data = await teamData(req, res, next);//TODO: change data used here
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/[resourceSlug]/tools');
}

/**
 * GET /[resourceSlug]/tools.json
 * team page json data
 */
export async function toolsJson(req, res, next) {
	const data = await teamData(req, res, next);//TODO: change data used here
	return res.json({ ...data, account: res.locals.account });
}

/**
 * POST /forms/team/switch
 * switch teams
 */
export async function switchTeam(req, res, _next) {

	const { orgId, teamId } = req.body;
	if (!orgId || typeof orgId !== 'string'
		|| !teamId || typeof teamId !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const switchOrg = res.locals.account.orgs.find(o => o.id.toString() === orgId);
	const switchTeam = switchOrg && switchOrg.teams.find(t => t.id.toString() === teamId);
	if (!switchOrg || !switchTeam) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await setCurrentTeam(res.locals.account._id, orgId, teamId);

	return res.json({ redirect: `/${teamId}/sessions` });

}
