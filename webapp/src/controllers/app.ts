'use strict';

import { dynamicResponse } from '@dr';
import { addAgent,getAgentById,getAgentsByTeam } from 'db/agent';
import { addApp, deleteAppById, getAppById, getAppsByTeam, updateApp } from 'db/app';
import { getAssetById } from 'db/asset';
import { addCrew, updateCrew } from 'db/crew';
import { getDatasourcesByTeam } from 'db/datasource';
import { addModel,getModelById,getModelsByTeam } from 'db/model';
import { addTask,getTasksByTeam } from 'db/task';
import { getToolForDatasource,getToolsById, getToolsByTeam } from 'db/tool';
import toObjectId from 'misc/toobjectid';
import { AppType } from 'struct/app';
import { ProcessImpl } from 'struct/crew';
import { ModelType } from 'struct/model';
import { ModelEmbeddingLength } from 'struct/model';

export async function appsData(req, res, _next) {
	const [apps, tasks, tools, agents, models, datasources] = await Promise.all([
		getAppsByTeam(req.params.resourceSlug),
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		apps,
		tasks,
		tools,
		agents,
		models,
		datasources,
	};
}

export async function appData(req, res, _next) {
	const [app, tasks, tools, agents, models, datasources] = await Promise.all([
		getAppById(req.params.resourceSlug, req.params.appId),
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug),
	 ]);
	 return {
		csrf: req.csrfToken(),
		app,
		tasks,
		tools,
		agents,
		models,
		datasources,
	};
}

/**
 * GET /[resourceSlug]/apps
 * App page html
 */
export async function appsPage(app, req, res, next) {
	const data = await appsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/apps`);
}

/**
 * GET /[resourceSlug]/app/[appId].json
 * App json data
 */
export async function appJson(req, res, next) {
	const data = await appData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/apps.json
 * Apps page json data
 */
export async function appsJson(req, res, next) {
	const data = await appsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/app/add
 * App add page html
 */
export async function appAddPage(app, req, res, next) {
	const data = await appsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/app/add`);
}

/**
 * GET /[resourceSlug]/app/[appId]/edit
 * App edit page html
 */
export async function appEditPage(app, req, res, next) {
	const data = await appData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/app/${req.params.appId}/edit`); 
}

/**
 * @api {post} /forms/app/add Add an app
 * @apiName add
 * @apiGroup App
 *
 * @apiParam {String} name App name
 * @apiParam {String[]} tags Tags for the app
 */
export async function addAppApi(req, res, next) {

	const {
		name, description, process, agents, memory, cache, managerModelId, tasks, iconId, tags,
		appName, conversationStarters, toolIds, datasourceId, agentId, agentName, role, goal, backstory, modelId,
		type, run
	}  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}//TODO:validation

	const foundIcon = await getAssetById(iconId);

	let addedCrew
		, chatAgent;
	if (type as AppType === AppType.CREW) {
		addedCrew = await addCrew({
			orgId: res.locals.matchingOrg.id,
			teamId: toObjectId(req.params.resourceSlug),
			name,
			tasks: tasks.map(toObjectId),
			agents: agents.map(toObjectId),
			process,
			managerModelId: toObjectId(managerModelId),
		});
	} else {
		if (agentId) {
			//using agent with agentId
			chatAgent = await getAgentById(req.params.resourceSlug, agentId);
			if (!chatAgent) {
				return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
			}
		} else if (modelId) { //
			const foundModel = await getModelById(req.params.resourceSlug, modelId);
			if (!foundModel) {
				return dynamicResponse(req, res, 400, { error: 'Invalid model ID' });
			}
			chatAgent = await addAgent({
				orgId: res.locals.matchingOrg.id,
				teamId: toObjectId(req.params.resourceSlug),
			    name: agentName,
			    role,
			    goal,
			    backstory,
				modelId: toObjectId(modelId),
				functionModelId: null,
				maxIter: null,
				maxRPM: null,
				verbose: false,
				allowDelegation: false,
				toolIds: [],
			});
		} else {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	}

	const addedApp = await addApp({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: appName,
		description,
		tags: (tags||[])
			.map(tag => tag.trim())
			.filter(x => x),
		author: res.locals.matchingTeam.name,
		icon: foundIcon ? {
			id: foundIcon._id,
			filename: foundIcon.filename,
		} : null,
		type,
		...(type === AppType.CREW ? {
			crewId: addedCrew ? addedCrew.insertedId : null,
			memory: memory === true,
			cache: cache === true,
		}: {
			agentId: agentId ? toObjectId(agentId) : chatAgent.insertedId,
			datasourceId: datasourceId ? toObjectId(datasourceId) : null,
			toolIds: toolIds.map(toObjectId),
			conversationStarters: (conversationStarters||[])
				.map(x => x.trim())
				.filter(x => x),
		}),
	});

	return dynamicResponse(req, res, 302, run ? { _id: addedApp.insertedId } : { _id: addedApp.insertedId, redirect: `/${req.params.resourceSlug}/apps` });

}

/**
 * @api {post} /forms/app/[appId]/edit Edit an app
 * @apiName edit
 * @apiGroup App
 *
 * @apiParam {String} appId App id
 */
export async function editAppApi(req, res, next) {

	const { memory, cache, name, description, tags, agents, process, tasks, managerModelId, iconId }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const app = await getAppById(req.params.resourceSlug, req.params.appId);
	if (!app) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundIcon = await getAssetById(iconId);

	//const [updatedCrew, _] = 
	await Promise.all([
		updateCrew(req.params.resourceSlug, app.crewId, {
			orgId: res.locals.matchingOrg.id,
			teamId: toObjectId(req.params.resourceSlug),
			name,
			tasks: tasks.map(toObjectId),
			agents: agents.map(toObjectId),
			process,
			managerModelId: toObjectId(managerModelId)
		}),
		updateApp(req.params.resourceSlug, req.params.appId, {
		    name,
			description,
			memory: memory === true,
			cache: cache === true,
			tags: (tags||[]) //TODO
				.map(t => t.trim())
				.filter(t => t),
			icon: foundIcon ? {
				id: foundIcon._id,
				filename: foundIcon.filename,
			} : null,
		})
	]);

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/app/${req.params.appId}/edit`*/ });

}

/**
 * @api {delete} /forms/app/[appId] Delete an app
 * @apiName delete
 * @apiGroup App
 *
 * @apiParam {String} appId App id
 */
export async function deleteAppApi(req, res, next) {

	const { appId }  = req.body;

	if (!appId || typeof appId !== 'string' || appId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await deleteAppById(req.params.resourceSlug, appId);

	return dynamicResponse(req, res, 302, {});
}

