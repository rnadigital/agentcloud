'use strict';

import { dynamicResponse } from '@dr';
import { addAgent,getAgentsByTeam } from 'db/agent';
import { addApp, deleteAppById, getAppById, getAppsByTeam, updateApp } from 'db/app';
import { getAssetById } from 'db/asset';
import { addCrew, updateCrew } from 'db/crew';
import { getDatasourcesByTeam } from 'db/datasource';
import { addModel,getModelsByTeam } from 'db/model';
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

	const { memory, cache, name, description, tags, conversationStarters, agents, process, tasks, managerModelId, iconId, run }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundIcon = await getAssetById(iconId);

	const addedCrew = await addCrew({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		tasks: tasks.map(toObjectId),
		agents: agents.map(toObjectId),
		process,
		managerModelId: toObjectId(managerModelId),
	});
	const addedApp = await addApp({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		memory: memory === true,
		cache: cache === true,
		tags: (tags||[])
			.map(tag => tag.trim())
			.filter(x => x),
		conversationStarters: (conversationStarters||[])
			.map(x => x.trim())
			.filter(x => x),
		type: AppType.CREW,
		crewId: addedCrew.insertedId,
		author: res.locals.matchingTeam.name,
		icon: foundIcon ? {
			id: foundIcon._id,
			filename: foundIcon.filename,
		} : null,
	});

	return dynamicResponse(req, res, 302, run ? { _id: addedApp.insertedId } : { _id: addedApp.insertedId, redirect: `/${req.params.resourceSlug}/apps` });

}

/**
 * @api {post} /forms/app/add Add an app
 * @apiName add
 * @apiGroup App
 *
 * @apiParam {String} name App name
 * @apiParam {String[]} tags Tags for the app
 */
export async function addAppApiSimple(req, res, next) {

	const { conversationStarters, modelType, config, datasourceId, run }  = req.body;

	//todo: validation

	let toolIds = req.body.toolIds || [];
	const foundTools = await getToolsById(req.params.resourceSlug, toolIds);
	if (!foundTools || foundTools.length !== toolIds.length) {
		return dynamicResponse(req, res, 400, { error: 'Invalid tool IDs' });
	}

	const datasourceTool = await getToolForDatasource(req.params.resourceSlug, datasourceId);
	if (datasourceTool) {
		toolIds.push(datasourceTool._id);
	}

	const addedModel = await addModel({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: config?.model,
		model: config?.model,
		embeddingLength: ModelEmbeddingLength[config?.model] || 0,
		modelType: ModelEmbeddingLength[config?.model] ? 'embedding' : 'llm',
		type: modelType,
		config: config, //TODO: validation
		hidden: true,
	});
	const addedAgent = await addAgent({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
	    name: 'Chat agent',
	    role: 'A helpful assistant',
	    goal: 'Follow instructions and assist the user in completing all the tasks.',
	    backstory: ' .',
		modelId: toObjectId(addedModel.insertedId),
		functionModelId: toObjectId(addedModel.insertedId),
		maxIter: null,
		maxRPM: null,
		verbose: true,
		allowDelegation: false,
		toolIds: toolIds.map(toObjectId),
		icon : null,
		hidden: true,
	});
	const addedTask = await addTask({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: 'Chat task',
		description : 'Chat back and forth with the user, get human input each time.',
		expectedOutput: '',
		toolIds: toolIds.map(toObjectId),
		agentId: toObjectId(addedAgent.insertedId),
		asyncExecution: false,
		requiresHumanInput: true,
		icon : null,
		hidden: true,
	});
	const addedCrew = await addCrew({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: 'chat crew',
		tasks: [addedTask.insertedId].map(toObjectId),
		agents: [addedAgent.insertedId].map(toObjectId),
		process: ProcessImpl.SEQUENTIAL,
		managerModelId: toObjectId(addedModel.insertedId),
		hidden: true,
	});
	const addedApp = await addApp({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: 'Chat app',
		description: 'A simple conversation.',
		memory: false,
		cache: false,
		crewId: addedCrew.insertedId,
		author: res.locals.matchingTeam.name,
		icon: null,
		type: AppType.CHAT,
		// hidden: true,
	});

	return dynamicResponse(req, res, 302, (run ? { _id: addedApp?.insertedId } : { redirect: `/${req.params.resourceSlug}/apps` }));

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

