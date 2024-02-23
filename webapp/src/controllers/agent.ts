'use strict';

import { getModelById } from 'db/model';
import { getModelsByTeam } from 'db/model';
import { AgentType } from 'struct/agent';

import { addAgent, deleteAgentById, getAgentById, getAgentsByTeam, updateAgent } from '../db/agent';
import { removeAgentFromCrews } from '../db/crew';
import { getDatasourcesById, getDatasourcesByTeam } from '../db/datasource';
import { getToolsById, getToolsByTeam } from '../db/tool';
import toObjectId from '../lib/misc/toobjectid';
import { ModelList } from '../lib/struct/model';
import { chainValidations, PARENT_OBJECT_FIELD_NAME, validateField } from '../lib/utils/validationUtils';
import { dynamicResponse } from '../util';

export async function agentsData(req, res, _next) {
	const [agents, models, tools, datasources] = await Promise.all([
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		agents,
		models,
		tools,
		datasources,
	};
}

/**
 * GET /[resourceSlug]/agents
 * team page html
 */
export async function agentsPage(app, req, res, next) {
	const data = await agentsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/agents`);
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
	return app.render(req, res, `/${req.params.resourceSlug}/agent/add`);
}

export async function agentData(req, res, _next) {
	const [agent, models, tools, datasources] = await Promise.all([
		getAgentById(req.params.resourceSlug, req.params.agentId),
		getModelsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		agent,
		models,
		tools,
		datasources,
	};
}

/**
 * GET /[resourceSlug]/agent/[agentId]/edit
 * team page html
 */
export async function agentEditPage(app, req, res, next) {
	const data = await agentData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/agent/${data.agent._id}/edit`);
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

	const { name, model, modelId, type, systemMessage, toolIds, datasourceIds }  = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true, regexMatch: /^[a-zA-Z_][a-zA-Z0-9_]*$/g, customError: 'Name must start with letter or underscore and must not contain spaces' }},
		{ field: 'modelId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'type', validation: { notEmpty: true }},
		{ field: 'systemMessage', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'toolIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid Tools' }},
		{ field: 'datasourceIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid data sources' }},
	], { name: 'Name', modelId: 'Model', systemMessage: 'Instructions', type: 'Type'});
	if (validationError) {	
		return dynamicResponse(req, res, 400, { error: validationError });
	}
	
	const agents = await getAgentsByTeam(req.params.resourceSlug);
	if (agents.some(agent => agent.name === name && agent._id.toString() !== req.params.agentId)) {
		return dynamicResponse(req, res, 400, { error: 'Duplicate agent name' });
	}
		
    // Check for foundTools
	const foundTools = await getToolsById(req.params.resourceSlug, toolIds);
	if (!foundTools || foundTools.length !== toolIds.length) {
		return dynamicResponse(req, res, 400, { error: 'Invalid tool IDs' });
	}

	// Check for foundDatasources
	if (datasourceIds && datasourceIds.length > 0) {
		const foundDatasources = await getDatasourcesById(req.params.resourceSlug, datasourceIds);
		if (!foundDatasources || foundDatasources.length !== datasourceIds.length) {
			return dynamicResponse(req, res, 400, { error: 'Invalid datasource IDs' });
		}
	}

	// Check for model
	if (modelId && modelId.length > 0) {
		const foundModel = await getModelById(req.params.resourceSlug, modelId);
		if (!foundModel) {
			return dynamicResponse(req, res, 400, { error: 'Invalid model ID' });
		}
	}

	const addedAgent = await addAgent({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
	    name,
	 	type: type === AgentType.EXECUTOR_AGENT
	 		? AgentType.USER_PROXY_AGENT
	 		: type as AgentType,
		codeExecutionConfig: type === AgentType.EXECUTOR_AGENT 
			? { lastNMessages: 5, workDirectory: 'output' }
			: null,
		systemMessage,
		humanInputMode: type === AgentType.EXECUTOR_AGENT
			? 'TERMINAL'
			: [AgentType.USER_PROXY_AGENT, AgentType.QDRANT_RETRIEVER_USER_PROXY_AGENT].indexOf(type) >= 0
				? 'ALWAYS'
				: null,
		model,
		modelId: toObjectId(modelId),
		toolIds: foundTools.map(t => t._id),
		datasourceIds: datasourceIds,
	});

	return dynamicResponse(req, res, 302, { _id: addedAgent.insertedId, redirect: `/${req.params.resourceSlug}/agents` });

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

	const { name, model, modelId, type, systemMessage, toolIds, datasourceIds }  = req.body;
	
	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true, regexMatch: /^[a-zA-Z_][a-zA-Z0-9_]*$/g, customError: 'Name must start with letter or underscore and must not contain spaces' }},
		{ field: 'modelId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'type', validation: { notEmpty: true }},
		{ field: 'systemMessage', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'toolIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid Tools' }},
		{ field: 'datasourceIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid data sources' }},
	], { name: 'Name', modelId: 'Model', systemMessage: 'Instructions', type: 'Type'});

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const agents = await getAgentsByTeam(req.params.resourceSlug);
	if (agents.some(agent => agent.name === name && agent._id.toString() !== req.params.agentId)) {
		return dynamicResponse(req, res, 400, { error: 'Duplicate agent name' });
	}
	
	const foundTools = await getToolsById(req.params.resourceSlug, toolIds);
	if (!foundTools || foundTools.length !== toolIds.length) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundDatasources = await getDatasourcesById(req.params.resourceSlug, datasourceIds);
	if (!foundDatasources || foundDatasources.length !== datasourceIds.length) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await updateAgent(req.params.resourceSlug, req.params.agentId, {
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
			: [AgentType.USER_PROXY_AGENT, AgentType.QDRANT_RETRIEVER_USER_PROXY_AGENT].indexOf(type) >= 0
				? 'ALWAYS'
				: null,
		model,
		modelId: toObjectId(modelId),
		toolIds: foundTools.map(t => t._id),
		datasourceIds: datasourceIds,
	});

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/agent/${req.params.agentId}/edit`*/ });

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

	await removeAgentFromCrews(req.params.resourceSlug, agentId);

	await deleteAgentById(req.params.resourceSlug, agentId);

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/agents`*/ });

}
