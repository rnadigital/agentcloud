'use strict';

import { dynamicResponse } from '@dr';
import {
	addAgent,
	deleteAgentById,
	deleteAgentByIdReturnAgent,
	getAgentById,
	getAgentsByTeam,
	updateAgent,
	updateAgentGetOldAgent
} from 'db/agent';
import { addAsset, attachAssetToObject, deleteAssetById, getAssetById } from 'db/asset';
import { removeAgentFromCrews } from 'db/crew';
import { getModelById } from 'db/model';
import { getModelsByTeam } from 'db/model';
import { getToolsById, getToolsByTeam } from 'db/tool';
import { getVariableById, getVariablesByTeam, updateVariable } from 'db/variable';
import toObjectId from 'lib/misc/toobjectid';
import StorageProviderFactory from 'lib/storage';
import { chainValidations } from 'lib/utils/validationutils';
import { ObjectId } from 'mongodb';
import path from 'path';
import { Asset, IconAttachment } from 'struct/asset';
import { CollectionName } from 'struct/db';

import { cloneAssetInStorageProvider } from './asset';

export type AgentsDataReturnType = Awaited<ReturnType<typeof agentsData>>;

export async function agentsData(req, res, _next) {
	const [agents, models, tools, variables] = await Promise.all([
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getVariablesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		agents,
		models,
		tools,
		variables
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

export type AgentDataReturnType = Awaited<ReturnType<typeof agentData>>;

export async function agentData(req, res, _next) {
	const [agent, models, tools, variables] = await Promise.all([
		getAgentById(req.params.resourceSlug, req.params.agentId),
		getModelsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getVariablesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		agent,
		models,
		tools,
		variables
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
		iconId,
		variableIds,
		cloning
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
			},
			{
				field: 'variableIds',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Variables'
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

	const newAgentId = new ObjectId();
	const collectionType = CollectionName.Agents;
	let attachedIconToAgent = await cloneAssetInStorageProvider(
		iconId,
		cloning,
		newAgentId,
		collectionType,
		req.params.resourceSlug
	);

	const existingVariablePromises = variableIds.map(async (id: string) => {
		const variable = await getVariableById(req.params.resourceSlug, id);
		if (!variable) {
			throw new Error(`Variable with ID ${id} not found`);
		}
	});

	try {
		await Promise.all(existingVariablePromises);
	} catch (error) {
		return dynamicResponse(req, res, 400, { error: error.message });
	}

	const addedAgent = await addAgent({
		_id: newAgentId,
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
		icon: attachedIconToAgent
			? {
					id: attachedIconToAgent._id,
					filename: attachedIconToAgent.filename,
					linkedId: newAgentId
				}
			: null,
		variableIds: (variableIds || []).map(toObjectId),
		dateCreated: new Date()
	});

	if (variableIds && variableIds.length > 0) {
		const updatePromises = variableIds.map(async (id: string) => {
			const variable = await getVariableById(req.params.resourceSlug, id);
			const updatedVariable = {
				...variable,
				usedInAgents: [...(variable.usedInAgents || []), addedAgent.insertedId]
			};
			return updateVariable(req.params.resourceSlug, id, updatedVariable);
		});
		await Promise.all(updatePromises);
	}

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
		iconId,
		variableIds
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
			},
			{
				field: 'variableIds',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Variables'
				}
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

	const agent = await getAgentById(req.params.resourceSlug, req.params.agentId);

	if (!agent) {
		return dynamicResponse(req, res, 400, { error: 'AgentId not valid' });
	}

	const existingVariablePromises = variableIds.map(async (id: string) => {
		const variable = await getVariableById(req.params.resourceSlug, id);
		if (!variable) {
			throw new Error(`Variable with ID ${id} not found`);
		}
	});

	try {
		await Promise.all(existingVariablePromises);
	} catch (error) {
		return dynamicResponse(req, res, 400, { error: error.message });
	}

	const existingVariableIds = new Set(agent?.variableIds?.map(v => v.toString()) || []);
	const newVariableIds = new Set(variableIds);

	const updatePromises = [...existingVariableIds, ...newVariableIds].map(async (id: string) => {
		const variable = await getVariableById(req.params.resourceSlug, id);
		const usedInAgents = variable?.usedInAgents
			? new Set(variable.usedInAgents?.map(v => v.toString()))
			: new Set([]);

		if (existingVariableIds.has(id) && !newVariableIds.has(id)) {
			usedInAgents.delete(req.params.agentId);
		} else if (!existingVariableIds.has(id) && newVariableIds.has(id)) {
			usedInAgents.add(req.params.agentId);
		}

		const updatedVariable = {
			...variable,
			usedInAgents: Array.from(usedInAgents, id => toObjectId(id))
		};
		return updateVariable(req.params.resourceSlug, id, updatedVariable);
	});

	await Promise.all(updatePromises);

	let attachedIconToApp = agent?.icon;
	if (agent?.icon?.id.toString() !== iconId) {
		const collectionType = CollectionName.Agents;
		const newAttachment = await attachAssetToObject(iconId, req.params.agentId, collectionType);
		if (newAttachment) {
			attachedIconToApp = {
				id: newAttachment._id,
				filename: newAttachment.filename,
				linkedId: newAttachment.linkedToId
			};
		}
	}

	const oldAgent = await updateAgentGetOldAgent(req.params.resourceSlug, req.params.agentId, {
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
		icon: iconId ? attachedIconToApp : null,
		variableIds: (variableIds || []).map(toObjectId)
	});

	if (oldAgent?.icon?.id && oldAgent?.icon?.id?.toString() !== iconId) {
		await deleteAssetById(oldAgent.icon.id);
	}

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

	const oldAgent = await deleteAgentByIdReturnAgent(req.params.resourceSlug, agentId);

	if (oldAgent.variableIds?.length > 0) {
		const updatePromises = oldAgent.variableIds.map(async (id: string) => {
			const variable = await getVariableById(req.params.resourceSlug, id);
			const usedInAgents = variable?.usedInAgents.map(a => a.toString());
			if (usedInAgents?.length > 0) {
				const newUsedInAgents = usedInAgents.filter(a => a !== agentId);
				return updateVariable(req.params.resourceSlug, id, {
					usedInAgents: newUsedInAgents.map(a => toObjectId(a))
				});
			}
			return null;
		});
		await Promise.all(updatePromises);
	}

	if (oldAgent?.icon) {
		await deleteAssetById(oldAgent.icon.id);
	}

	return dynamicResponse(req, res, 302, {
		/*redirect: `/${req.params.resourceSlug}/agents`*/
	});
}
