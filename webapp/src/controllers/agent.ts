'use strict';

import { dynamicResponse } from '@dr';
import { addAgent, deleteAgentById, getAgentById, getAgentsByTeam, updateAgent } from 'db/agent';
import { getAssetById } from 'db/asset';
import { removeAgentFromCrews } from 'db/crew';
import { getModelById } from 'db/model';
import { getModelsByTeam } from 'db/model';
import { getToolsById, getToolsByTeam } from 'db/tool';
import toObjectId from 'lib/misc/toobjectid';
import { chainValidations } from 'lib/utils/validationutils';

export async function agentsData(req, res, _next) {
	const [agents, models, tools] = await Promise.all([
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		agents,
		models,
		tools
	};
}

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
		getToolsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		agent,
		models,
		tools
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
export async function agentJson(req, res, next) {
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
		iconId
	} = req.body;

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'modelId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } },
			{ field: 'functionModelId', validation: { hasLength: 24, ofType: 'string' } },
			{ field: 'role', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'goal', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'backstory', validation: { notEmpty: true, ofType: 'string' } },
			{
				field: 'toolIds',
				validation: {
					notEmpty: true,
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Tools'
				}
			}
		],
		{ name: 'Name', modelId: 'Model', functionModelId: 'Function Calling Model' }
	);
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

	const foundIcon = await getAssetById(iconId);

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
		icon: foundIcon
			? {
					id: foundIcon._id,
					filename: foundIcon.filename
				}
			: null
	});

	return dynamicResponse(req, res, 302, {
		_id: addedAgent.insertedId,
		redirect: `/${req.params.resourceSlug}/agents`
	});
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
		iconId
	} = req.body;

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'modelId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } },
			{ field: 'functionModelId', validation: { hasLength: 24, ofType: 'string' } },
			{ field: 'role', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'goal', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'backstory', validation: { notEmpty: true, ofType: 'string' } },
			{
				field: 'toolIds',
				validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid Tools' }
			}
		],
		{ name: 'Name', modelId: 'Model', functionModelId: 'Function Calling Model' }
	);
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

	const foundIcon = await getAssetById(iconId);

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
		icon: foundIcon
			? {
					id: foundIcon._id,
					filename: foundIcon.filename
				}
			: null
	});

	return dynamicResponse(req, res, 302, {
		/*redirect: `/${req.params.resourceSlug}/agent/${req.params.agentId}/edit`*/
	});
}

/**
 * @api {delete} /forms/agent/[agentId] Delete an agent
 * @apiName delete
 * @apiGroup Agent
 *
 * @apiParam {String} agentId Agent id
 */
export async function deleteAgentApi(req, res, next) {
	const { agentId } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'agentId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
		{ agentId: 'Agent' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	await removeAgentFromCrews(req.params.resourceSlug, agentId);

	await deleteAgentById(req.params.resourceSlug, agentId);

	return dynamicResponse(req, res, 302, {
		/*redirect: `/${req.params.resourceSlug}/agents`*/
	});
}
