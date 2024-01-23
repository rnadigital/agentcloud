'use strict';

import { AgentType } from 'struct/agent';

import { addAgent, deleteAgentById, getAgentById, getAgentsByTeam, updateAgent } from '../db/agent';
import { getCredentialById, getCredentialsById, getCredentialsByTeam } from '../db/credential';
import { getDatasourcesById, getDatasourcesByTeam } from '../db/datasource';
import { removeAgentFromGroups } from '../db/group';
import { getToolsById, getToolsByTeam } from '../db/tool';
import toObjectId from '../lib/misc/toobjectid';
import { ModelList } from '../lib/struct/model';
import { chainValidations, PARENT_OBJECT_FIELD_NAME, validateField } from '../lib/utils/ValidationUtils';
import { dynamicResponse } from '../util';

export async function agentsData(req, res, _next) {
	const [agents, credentials, tools, datasources] = await Promise.all([
		getAgentsByTeam(req.params.resourceSlug),
		getCredentialsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		agents,
		credentials,
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
	const [agent, credentials, tools, datasources] = await Promise.all([
		getAgentById(req.params.resourceSlug, req.params.agentId),
		getCredentialsByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		agent,
		credentials,
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

	const { name, model, credentialId, type, systemMessage, toolIds, datasourceIds }  = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true }},
		{ field: 'credentialId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'type', validation: { notEmpty: true }},
		{ field: 'systemMessage', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'toolIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid Tools' }},
		{ field: 'datasourceIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid data sources' }},
	], { name: 'Name', credentialId: 'Credential', systemMessage: 'Instructions', type: 'Type'});
	if (validationError) {	
		return dynamicResponse(req, res, 400, { error: validationError });
	}
	
	for (let team of res.locals.matchingOrg.teams) {
		validationError = await valdiateCredentialModel(team.id, credentialId, model);
		if (validationError) {
			return dynamicResponse(req, res, 400, { error: validationError });
		}
		const agents = await getAgentsByTeam(team.id);
		if (agents.some(agent => agent.name === name)) {
			return dynamicResponse(req, res, 400, { error: 'Duplicate agent name' });
		}
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

	// Check for foundCredentials
	if (credentialId && credentialId.length > 0) {
		const foundCredential = await getCredentialById(req.params.resourceSlug, credentialId);
		if (!foundCredential) {
			return dynamicResponse(req, res, 400, { error: 'Invalid credential ID' });
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
			: type === AgentType.USER_PROXY_AGENT
				? 'ALWAYS'
				: null,
		model,
		credentialId: toObjectId(credentialId),
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

	const { name, model, credentialId, type, systemMessage, toolIds, datasourceIds }  = req.body;
	
	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true }},
		{ field: 'credentialId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'type', validation: { notEmpty: true }},
		{ field: 'systemMessage', validation: { notEmpty: true, lengthMin: 2 }},
		{ field: 'toolIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid Tools' }},
		{ field: 'datasourceIds', validation: { notEmpty: true, hasLength: 24, asArray: true, customError: 'Invalid data sources' }},
	], { name: 'Name', credentialId: 'Credential', systemMessage: 'Instructions', type: 'Type'});

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}
	for (let team of res.locals.matchingOrg.teams) {
		validationError = await valdiateCredentialModel(team.id, credentialId, model);
		if (validationError) {
			return dynamicResponse(req, res, 400, { error: validationError });
		}
		const agents = await getAgentsByTeam(team.id);
		if (agents.some(agent => agent.name === name && !agent._id.equals(req.params.agentId))) {
			return dynamicResponse(req, res, 400, { error: 'Duplicate agent name' });
		}
	}

	const foundTools = await getToolsById(req.params.resourceSlug, toolIds);
	if (!foundTools || foundTools.length !== toolIds.length) {
		//deleted toolIds or ones from another team
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//TODO: fetch datasources by id and compare length like ^ to ensure valid

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
			: type === AgentType.USER_PROXY_AGENT
				? 'ALWAYS'
				: null,
		model,
		credentialId: toObjectId(credentialId),
		toolIds: foundTools.map(t => t._id),
		datasourceIds: datasourceIds,
	});

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/agent/${req.params.agentId}/edit`*/ });

}

async function valdiateCredentialModel(teamId, credentialId, model) {
	const credential = await getCredentialById(teamId, credentialId);
	if (credential) {
		const allowedModels = ModelList[credential.type];
		return validateField(model, PARENT_OBJECT_FIELD_NAME, { inSet: allowedModels ? new Set(allowedModels) : undefined /* allows invalid types */, customError: `Model ${model} is not valid for provided credential` }, {});
	} else {
		return 'Invalid credential';
	}
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

	await removeAgentFromGroups(req.params.resourceSlug, agentId);

	await deleteAgentById(req.params.resourceSlug, agentId);

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/agents`*/ });

}
