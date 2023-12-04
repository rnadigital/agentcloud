'use strict';

import { getAgentById, getAgentsByTeam, addAgent, AgentType, updateAgent, deleteAgentById } from '../db/agent';
import { removeAgentFromGroups } from '../db/group';
import { getCredentialsByTeam } from '../db/credential';
import { getToolsByTeam, getToolsById } from '../db/tool';
import { dynamicResponse } from '../util';
import toObjectId from '../lib/misc/toobjectid';

export async function agentsData(req, res, _next) {
	const [agents, credentials, tools] = await Promise.all([
		getAgentsByTeam(res.locals.account.currentTeam),
		getCredentialsByTeam(res.locals.account.currentTeam),
		getToolsByTeam(res.locals.account.currentTeam),
	]);
	return {
		csrf: req.csrfToken(),
		agents,
		credentials,
		tools,
	};
}

/**
 * GET /[resourceSlug]/agents
 * team page html
 */
export async function agentsPage(app, req, res, next) {
	const data = await agentsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${res.locals.account.currentTeam}/agents`);
}

/**
 * GET /[resourceSlug]/agents.json
 * team agents json data
 */
export async function agentsJson(req, res, next) {
	const data = await agentsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/agent/add
 * team page html
 */
export async function agentAddPage(app, req, res, next) {
	const data = await agentsData(req, res, next); //needed?
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${res.locals.account.currentTeam}/agent/add`);
}

export async function agentData(req, res, _next) {
	const [agent, credentials, tools] = await Promise.all([
		getAgentById(res.locals.account.currentTeam, req.params.agentId),
		getCredentialsByTeam(res.locals.account.currentTeam),
		getToolsByTeam(res.locals.account.currentTeam),
	]);
	return {
		csrf: req.csrfToken(),
		agent,
		credentials,
		tools,
	};
}

/**
 * GET /[resourceSlug]/agent/[agentId]/edit
 * team page html
 */
export async function agentEditPage(app, req, res, next) {
	const data = await agentData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${res.locals.account.currentTeam}/agent/${data.agent._id}/edit`);
}

/**
 * GET /[resourceSlug]/agent/[agentId].json
 * team page html
 */
export async function agentJson(app, req, res, next) {
	const data = await agentData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * @api {post} /forms/agent/add Add an agent
 * @apiName add
 * @apiGroup Agent
 *
 * @apiParam {String} name Agent name
 * @apiParam {String} type UserProxyAgent | AssistantAgent
 * @apiParam {String} systemMessage Definition of skills, tasks, boundaries, outputs
 */
export async function addAgentApi(req, res, next) {

	const { name, model, credentialId, type, systemMessage, toolIds }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0
		|| !model || typeof model !== 'string' || model.length === 0 // TODO: or is not one of models
		|| !credentialId || typeof credentialId !== 'string' || credentialId.length !== 24
		|| !type || typeof type !== 'string' || type.length === 0
		|| !systemMessage || typeof systemMessage !== 'string' || systemMessage.length === 0
		|| (toolIds && (!Array.isArray(toolIds) || toolIds.some(t => t.length !== 24)))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundTools = await getToolsById(res.locals.account.currentTeam, toolIds);
	if (!foundTools || foundTools.length !== toolIds.length) {
		//deleted toolIds or ones from another team
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const addedAgent = await addAgent({
		orgId: res.locals.account.currentOrg,
		teamId: res.locals.account.currentTeam,
	    name,
	 	type: type === AgentType.EXECUTOR_AGENT
	 		? AgentType.USER_PROXY_AGENT
	 		: type as AgentType, //TODO: revise
		codeExecutionConfig: type === AgentType.EXECUTOR_AGENT 
			? { lastNMessages: 5, workDirectory: 'output' }
			: null,
		systemMessage,
		humanInputMode: type === AgentType.EXECUTOR_AGENT
			? 'TERMINAL'
			: type === AgentType.USER_PROXY_AGENT
				? 'ALWAYS'
				: null,
		model,
		credentialId: toObjectId(credentialId),
		toolIds: foundTools.map(t => t._id),
	});

	return dynamicResponse(req, res, 302, { _id: addedAgent.insertedId, redirect: `/${res.locals.account.currentTeam}/agents` });

}

/**
 * @api {post} /forms/agent/[agentId]/edit Edit an agent
 * @apiName edit
 * @apiGroup Agent
 *
 * @apiParam {String} name Agent name
 * @apiParam {String} type UserProxyAgent | AssistantAgent
 * @apiParam {String} systemMessage Definition of skills, tasks, boundaries, outputs
 */
export async function editAgentApi(req, res, next) {

	const { name, model, credentialId, type, systemMessage, toolIds }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0
		|| !model || typeof model !== 'string' || model.length === 0 // TODO: or is not one of models
		|| !credentialId || typeof credentialId !== 'string' || credentialId.length !== 24
		|| !type || typeof type !== 'string' || type.length === 0
		|| !systemMessage || typeof systemMessage !== 'string' || systemMessage.length === 0
		|| (toolIds && (!Array.isArray(toolIds) || toolIds.some(t => t.length !== 24)))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundTools = await getToolsById(res.locals.account.currentTeam, toolIds);
	if (!foundTools || foundTools.length !== toolIds.length) {
		//deleted toolIds or ones from another team
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await updateAgent(res.locals.account.currentTeam, req.params.agentId, {
	    name,
	 	type: type === AgentType.EXECUTOR_AGENT
	 		? AgentType.USER_PROXY_AGENT
	 		: type as AgentType, //TODO: revise
		codeExecutionConfig: type === AgentType.EXECUTOR_AGENT
			? { lastNMessages: 5, workDirectory: 'output' }
			: null,
		systemMessage,
		humanInputMode: type === AgentType.EXECUTOR_AGENT
			? 'TERMINAL'
			: type === AgentType.USER_PROXY_AGENT
				? 'ALWAYS'
				: null,
		model,
		credentialId: toObjectId(credentialId),
		toolIds: foundTools.map(t => t._id),
	});

	return dynamicResponse(req, res, 302, { /*redirect: `/${res.locals.account.currentTeam}/agent/${req.params.agentId}/edit`*/ });

}

/**
 * @api {delete} /forms/agent/[agentId] Delete an agent
 * @apiName delete
 * @apiGroup Agent
 *
 * @apiParam {String} agentId Agent id
 */
export async function deleteAgentApi(req, res, next) {

	const { agentId }  = req.body;

	if (!agentId || typeof agentId !== 'string' || agentId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await removeAgentFromGroups(res.locals.account.currentTeam, agentId);

	await deleteAgentById(res.locals.account.currentTeam, agentId);

	return dynamicResponse(req, res, 302, { /*redirect: `/${res.locals.account.currentTeam}/agents`*/ });

}
