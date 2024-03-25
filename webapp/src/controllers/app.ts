'use strict';

import { dynamicResponse } from '@dr';
import { getAgentsByTeam } from 'db/agent';
import { addApp, deleteAppById, getAppById, getAppsByTeam, updateApp } from 'db/app';
import { addCrew, updateCrew } from 'db/crew';
import { getModelsByTeam } from 'db/model';
import { getTasksByTeam } from 'db/task';
import { getToolsByTeam } from 'db/tool';
import toObjectId from 'misc/toobjectid';
import { AppType } from 'struct/app';
import { ProcessImpl } from 'struct/crew';

export async function appsData(req, res, _next) {
	const [apps, tasks, tools, agents, models] = await Promise.all([
		 getAppsByTeam(req.params.resourceSlug),
		 getTasksByTeam(req.params.resourceSlug),
		 getToolsByTeam(req.params.resourceSlug),
		 getAgentsByTeam(req.params.resourceSlug),
		 getModelsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		apps,
		tasks,
		tools,
		agents,
		models,
	};
}

export async function appData(req, res, _next) {
	const [app, tasks, tools, agents, models] = await Promise.all([
		 getAppById(req.params.resourceSlug, req.params.appId),
		 getTasksByTeam(req.params.resourceSlug),
		 getToolsByTeam(req.params.resourceSlug),
		 getAgentsByTeam(req.params.resourceSlug),
		 getModelsByTeam(req.params.resourceSlug),
	 ]);
	 return {
		csrf: req.csrfToken(),
		app,
		tasks,
		tools,
		agents,
		models
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

	const { name, description, tags, capabilities, agents, appType, process, tasks, managerModelId }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const addedCrew = await addCrew({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		tasks: tasks.map(toObjectId),
		agents: agents.map(toObjectId),
		process,
		managerModelId: toObjectId(managerModelId)
	});
	const addedApp = await addApp({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		tags: (tags||[])
			.map(tag => tag.trim()) // Assuming tags is an array of strings
			.filter(x => x),
		capabilities,
		crewId: addedCrew.insertedId,
		appType
	});

	return dynamicResponse(req, res, 302, { _id: addedApp.insertedId, redirect: `/${req.params.resourceSlug}/apps` });

}

/**
 * @api {post} /forms/app/[appId]/edit Edit an app
 * @apiName edit
 * @apiGroup App
 *
 * @apiParam {String} appId App id
 */
export async function editAppApi(req, res, next) {

	const { name, description, tags, capabilities, agents, appType, process, tasks, managerModelId }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const app = await getAppById(req.params.resourceSlug, req.params.appId);
	if (!app) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

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
			tags: (tags||[]) //TODO
				.map(t => t.trim())
				.filter(t => t),
			capabilities,
			appType
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

