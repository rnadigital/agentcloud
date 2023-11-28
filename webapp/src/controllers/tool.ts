'use strict';

import { getToolsByTeam, addTool, getToolById, deleteToolById, editTool } from '../db/tool';
import { getCredentialsByTeam } from '../db/credential';
import { removeAgentsTool } from '../db/agent';
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

export async function toolData(req, res, _next) {
	const [tool, credentials] = await Promise.all([
		getToolById(res.locals.account.currentTeam, req.params.toolId),
		getCredentialsByTeam(res.locals.account.currentTeam),
	]);
	return {
		csrf: req.csrfToken(),
		tool,
		credentials,
	};
}

/**
 * GET /[resourceSlug]/tool/:toolId.json
 * tool json data
 */
export async function toolJson(req, res, next) {
	const data = await toolsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/tool/:toolId/edit
 * tool json data
 */
export async function toolEditPage(app, req, res, next) {
	const data = await toolData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${res.locals.account.currentTeam}/tool/${data.tool._id}/edit`);
}
 
/**
 * GET /[resourceSlug]/tool/add
 * tool json data
 */
export async function toolAddPage(app, req, res, next) {
	const data = await toolData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${res.locals.account.currentTeam}/tool/add`);
}

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
	 	type: type as ToolType,
		data: {
			...data,
			builtin: false,
		    name: toSnakeCase(name),
		},
	});

	return dynamicResponse(req, res, 302, { redirect: `/${res.locals.account.currentTeam}/tools` });

}

export async function editToolApi(req, res, next) {

	const { name, type, data, toolId }  = req.body;

	await editTool(res.locals.account.currentTeam, toolId, {
	    name,
	 	type: type as ToolType,
		data: {
			...data,
			builtin: false,
		    name: toSnakeCase(name),
		},
	});

	return dynamicResponse(req, res, 302, { /*redirect: `/${res.locals.account.currentTeam}/tools`*/ });

}

/**
 * @api {delete} /forms/tool/[toolId] Delete a tool
 * @apiName delete
 * @apiGroup Tool
 *
 * @apiParam {String} toolID tool id
 */
export async function deleteToolApi(req, res, next) {

	const { toolId } = req.body;

	if (!toolId || typeof toolId !== 'string' || toolId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await Promise.all([
		deleteToolById(res.locals.account.currentTeam, toolId),
		removeAgentsTool(res.locals.account.currentTeam, toolId),
	]);

	return dynamicResponse(req, res, 302, { /*redirect: `/${res.locals.account.currentTeam}/agents`*/ });

}
