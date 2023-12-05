'use strict';

import { getGroupById, getGroupsByTeam, addGroup, updateGroup, deleteGroupById } from '../db/group';
import toObjectId from '../lib/misc/toobjectid';
import { getAgentsById, getAgentById, getAgentsByTeam, AgentType } from '../db/agent';
import { dynamicResponse } from '../util';

export async function groupsData(req, res, _next) {
	const groups = await getGroupsByTeam(res.locals.account.currentTeam); //TODO: change data fetched here to list of groups
	const teamAgents = await getAgentsByTeam(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		groups,
		hasAgents: teamAgents.length > 0,
	};
}

export async function groupData(req, res, _next) {
	const groupData = await getGroupById(res.locals.account.currentTeam, req.params.groupId);
	const teamAgents = await getAgentsByTeam(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		groupData,
		hasAgents: teamAgents.length > 0,
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
 * GET /[resourceSlug]/group/[groupId].json
 * group json data
 */
export async function groupJson(req, res, next) {
	const data = await groupData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
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
	res.locals.data = {
		...data,
		account: res.locals.account,
		query: {
			resourceSlug: res.locals.account.currentTeam,
			groupId: req.params.groupId,
		}
	};
	return app.render(req, res, `/${res.locals.account.currentTeam}/group/${req.params.groupId}/edit`); 
	//`/[resourceSlug]/group/[groupId]/edit`);
}

/**
 * @api {post} /forms/group/add Add a group
 * @apiName add
 * @apiGroup Group
 *
 * @apiParam {String} name Group name
 * @apiParam {String[]} agents array of other agent ids
 */
export async function addGroupApi(req, res, next) {

	const { name, adminAgent, agents, groupChat }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0
		|| !adminAgent || typeof adminAgent !== 'string' || adminAgent.length !== 24
		|| !agents || !Array.isArray(agents) || agents.length === 0 || agents.some(i => typeof i !== 'string' || i.length != 24)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundAgents = await getAgentsById(res.locals.account.currentTeam, agents);
	if (!foundAgents || foundAgents.length !== agents.length) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	const foundAdminAgent = await getAgentById(res.locals.account.currentTeam, adminAgent);
	if (!foundAdminAgent || foundAdminAgent.type !== AgentType.USER_PROXY_AGENT) {
		return dynamicResponse(req, res, 400, { error: 'Group admin must be a user proxy agent' });
	}

	const addedGroup = await addGroup({
		orgId: res.locals.account.currentOrg,
		teamId: res.locals.account.currentTeam,
		name,
		agents: agents.map(toObjectId),
		adminAgent: toObjectId(adminAgent),
		groupChat: groupChat === true,
	});

	return dynamicResponse(req, res, 302, { _id: addedGroup.insertedId, redirect: `/${res.locals.account.currentTeam}/groups` });

}

/**
 * @api {post} /forms/group/[groupId]/edit Edit a group
 * @apiName edit
 * @apiGroup Agent
 *
 * @apiParam {String} name Group name
 * @apiParam {String[]} agents array of other agent ids
 */
export async function editGroupApi(req, res, next) {

	const { name, adminAgent, agents, groupChat }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0
		|| !adminAgent || typeof adminAgent !== 'string' || adminAgent.length !== 24
		|| !agents || !Array.isArray(agents) || agents.some(i => typeof i !== 'string' || i.length != 24)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await updateGroup(res.locals.account.currentTeam, req.params.groupId, {
	    name,
	    agents: agents.map(toObjectId),
		adminAgent: toObjectId(adminAgent),
		groupChat: groupChat === true,
	});

	return dynamicResponse(req, res, 302, { redirect: `/${res.locals.account.currentTeam}/group/${req.params.groupId}/edit` });

}

/**
 * @api {delete} /forms/group/[groupId] Delete a group
 * @apiName delete
 * @apiGroup Group
 *
 * @apiParam {String} groupId Group id
 */
export async function deleteGroupApi(req, res, next) {

	const { groupId }  = req.body;

	if (!groupId || typeof groupId !== 'string' || groupId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await deleteGroupById(res.locals.account.currentTeam, groupId);

	return dynamicResponse(req, res, 302, { /*redirect: `/${res.locals.account.currentTeam}/groups`*/ });

}
