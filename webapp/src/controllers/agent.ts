'use strict';

import { dynamicResponse } from '@dr';
import { getModelById } from 'db/model';
import { getModelsByTeam } from 'db/model';

import { addAgent, deleteAgentById, getAgentById, getAgentsByTeam, updateAgent } from '../db/agent';
import { removeAgentFromCrews } from '../db/crew';
import { getDatasourcesById, getDatasourcesByTeam } from '../db/datasource';
import { getToolsById, getToolsByTeam } from '../db/tool';
import toObjectId from '../lib/misc/toobjectid';
import { ModelList } from '../lib/struct/model';
import { chainValidations, PARENT_OBJECT_FIELD_NAME, validateField } from '../lib/utils/validationUtils';

export async function agentsData(req, res, _next) {
	const [agents, models, tools] = await Promise.all([
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		agents,
		models,
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
	const [agent, models, tools] = await Promise.all([
		getAgentById(req.params.resourceSlug, req.params.agentId),
		getModelsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		agent,
		models,
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

	const {
		toolIds,
		name,
	    role,
	    goal,
	    backstory,
		modelId,
		functionModelId,
		maxIter,
		maxRPM,
		verbose,
		allowDelegation,
	 } = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'modelId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'role', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'goal', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'backstory', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'toolIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid Tools' }},
	], { name: 'Name', modelId: 'Model', functionModelId: 'Function Calling Model' });
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}
		
    // Check for foundTools
	const foundTools = await getToolsById(req.params.resourceSlug, toolIds);
	if (!foundTools || foundTools.length !== toolIds.length) {
		return dynamicResponse(req, res, 400, { error: 'Invalid tool IDs' });
	}

	// Check for model
	if (modelId && modelId.length > 0) {
		const foundModel = await getModelById(req.params.resourceSlug, modelId);
		if (!foundModel) {
			return dynamicResponse(req, res, 400, { error: 'Invalid model ID' });
		}
	}

	// Check for function calling model
	if (functionModelId && functionModelId.length > 0) {
		const foundModel = await getModelById(req.params.resourceSlug, functionModelId);
		if (!foundModel) {
			return dynamicResponse(req, res, 400, { error: 'Invalid function calling model ID' });
		}
	}

	const addedAgent = await addAgent({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
	    name,
	    role,
	    goal,
	    backstory,
		modelId: toObjectId(modelId),
		functionModelId: toObjectId(functionModelId),
		maxIter,
		maxRPM,
		verbose: verbose === true,
		allowDelegation: allowDelegation === true,
		toolIds: foundTools.map(t => t._id),
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

	const {
		toolIds,
		name,
	    role,
	    goal,
	    backstory,
		modelId,
		functionModelId,
		maxIter,
		maxRPM,
		verbose,
		allowDelegation,
	 } = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'modelId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'functionModelId', validation: { hasLength: 24 }},
		{ field: 'role', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'goal', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'backstory', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'toolIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid Tools' }},
	], { name: 'Name', modelId: 'Model', functionModelId: 'Function Calling Model' });
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

	await updateAgent(req.params.resourceSlug, req.params.agentId, {
	    name,
	    role,
	    goal,
	    backstory,
		modelId: toObjectId(modelId),
		functionModelId: toObjectId(functionModelId),
		maxIter,
		maxRPM,
		verbose: verbose === true,
		allowDelegation: allowDelegation === true,
		toolIds: foundTools.map(t => t._id),
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
