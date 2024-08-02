'use strict';

import { dynamicResponse } from '@dr';
import { addAgent, getAgentById, getAgentsByTeam, updateAgent } from 'db/agent';
import { addApp, deleteAppById, getAppById, getAppsByTeam, updateApp } from 'db/app';
import { getAssetById } from 'db/asset';
import { addCrew, updateCrew } from 'db/crew';
import { getDatasourcesByTeam } from 'db/datasource';
import { getModelById, getModelsByTeam } from 'db/model';
import { updateShareLinkPayload } from 'db/sharelink';
import { getTasksByTeam } from 'db/task';
import { getToolsByTeam } from 'db/tool';
import { chainValidations } from 'lib/utils/validationUtils';
import toObjectId from 'misc/toobjectid';
import { AppType } from 'struct/app';
import { ModelType } from 'struct/model';
import { SharingMode } from 'struct/sharing';

export async function appsData(req, res, _next) {
	const [apps, tasks, tools, agents, models, datasources] = await Promise.all([
		getAppsByTeam(req.params.resourceSlug),
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		apps,
		tasks,
		tools,
		agents,
		models,
		datasources
	};
}

export async function appData(req, res, _next) {
	const [app, tasks, tools, agents, models, datasources] = await Promise.all([
		getAppById(req.params.resourceSlug, req.params.appId),
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		app,
		tasks,
		tools,
		agents,
		models,
		datasources
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
 * GET /[resourceSlug]/app/[appId]/edit
 * App edit page html
 */
// export async function publicAppPage(app, req, res, next) {
// 	const data = await publicAppData(req, res, next); //TODO: public variant
// 	res.locals.data = { ...data, account: res.locals.account };
// 	return app.render(req, res, `/${req.params.resourceSlug}/app/${req.params.appId}`);
// }

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
		name,
		description,
		process,
		agents,
		memory,
		cache,
		// managerModelId,
		tasks,
		iconId,
		tags,
		conversationStarters,
		toolIds,
		agentId,
		agentName,
		role,
		goal,
		backstory,
		modelId,
		type,
		run,
		sharingMode,
		shareLinkShareId,
		verbose
	} = req.body;

	const isChatApp = (type as AppType) === AppType.CHAT;
	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'sharingMode',
				validation: { notEmpty: true, inSet: new Set(Object.values(SharingMode)) }
			},
			{
				field: 'shareLinkShareId',
				validation: { notEmpty: sharingMode === SharingMode.PUBLIC, ofType: 'string' }
			},
			{
				field: 'type',
				validation: { notEmpty: true, inSet: new Set([AppType.CHAT, AppType.CREW]) }
			},
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'description', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'agentName', validation: { notEmpty: isChatApp, ofType: 'string' } },
			{ field: 'modelId', validation: { notEmpty: isChatApp, hasLength: 24, ofType: 'string' } },
			{ field: 'role', validation: { notEmpty: isChatApp, ofType: 'string' } },
			{ field: 'goal', validation: { notEmpty: isChatApp, ofType: 'string' } },
			{ field: 'backstory', validation: { notEmpty: isChatApp, ofType: 'string' } },
			//Note: due to design limitation of validationUtil we need two checks for array fields to both check if theyre empty and validate each array element
			{ field: 'tasks', validation: { notEmpty: !isChatApp } },
			{ field: 'agents', validation: { notEmpty: !isChatApp } },
			{
				field: 'tasks',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Tasks'
				}
			},
			{
				field: 'agents',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Agents'
				}
			},
			// {
			// 	field: 'managerModelId',
			// 	validation: { notEmpty: !isChatApp, hasLength: 24, ofType: 'string' }
			// },
			{
				field: 'toolIds',
				validation: {
					notEmpty: isChatApp,
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Tools'
				}
			},
			{
				field: 'conversationStarters',
				validation: {
					notEmpty: isChatApp,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Conversation Starters'
				}
			}
			//TODO:validation
		],
		{
			name: 'App Name',
			agentName: 'Agent Name',
			modelId: 'Model'
			// managerModelId: 'Chat Manager Model'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const foundIcon = await getAssetById(iconId);

	let addedCrew, chatAgent;
	if ((type as AppType) === AppType.CREW) {
		addedCrew = await addCrew({
			orgId: res.locals.matchingOrg.id,
			teamId: toObjectId(req.params.resourceSlug),
			name,
			tasks: tasks.map(toObjectId),
			agents: agents.map(toObjectId),
			process,
			verbose
			// managerModelId: toObjectId(managerModelId)
		});
	} else {
		if (agentId) {
			await updateAgent(req.params.resourceSlug, agentId, {
				name: agentName,
				role,
				goal,
				backstory,
				modelId: toObjectId(modelId),
				toolIds: toolIds.map(toObjectId).filter(x => x)
			});
			chatAgent = await getAgentById(req.params.resourceSlug, agentId);
			if (!chatAgent) {
				return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
			}
			const chatAgentModel = await getModelById(req.params.resourceSlug, chatAgent?.modelId);
			if (!chatAgentModel) {
				return dynamicResponse(req, res, 400, { error: 'Agent model invalid or missing' });
			}
			if (
				![ModelType.OPENAI, ModelType.ANTHROPIC, ModelType.GOOGLE_VERTEX].includes(
					chatAgentModel?.type
				)
			) {
				return dynamicResponse(req, res, 400, {
					error: 'Only OpenAI, Anthropic and Google Vertex models are supported for chat apps.'
				});
			}
		} else if (modelId) {
			//
			const foundModel = await getModelById(req.params.resourceSlug, modelId);
			if (!foundModel) {
				return dynamicResponse(req, res, 400, { error: 'Invalid model ID' });
			}
			if (
				![ModelType.OPENAI, ModelType.ANTHROPIC, ModelType.GOOGLE_VERTEX].includes(foundModel?.type)
			) {
				return dynamicResponse(req, res, 400, {
					error: 'Only OpenAI, Anthropic and Google Vertex models are supported for chat apps.'
				});
			}
			chatAgent = await addAgent({
				orgId: res.locals.matchingOrg.id,
				teamId: toObjectId(req.params.resourceSlug),
				modelId: toObjectId(modelId),
				toolIds: toolIds.map(toObjectId).filter(x => x),
				name: agentName,
				role,
				goal,
				backstory,
				functionModelId: null,
				maxIter: null,
				maxRPM: null,
				verbose: false,
				allowDelegation: false
			});
		} else {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	}

	const addedApp = await addApp({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		tags: (tags || []).map(tag => tag.trim()).filter(x => x),
		author: res.locals.matchingTeam.name,
		icon: foundIcon
			? {
					id: foundIcon._id,
					filename: foundIcon.filename
				}
			: null,
		type,
		...((type as AppType) === AppType.CREW
			? {
					crewId: addedCrew ? addedCrew.insertedId : null,
					memory: memory === true,
					cache: cache === true
				}
			: {
					chatAppConfig: {
						agentId: agentId ? toObjectId(agentId) : toObjectId(chatAgent.insertedId),
						conversationStarters: (conversationStarters || []).map(x => x.trim()).filter(x => x)
					}
				}),
		sharingConfig: {
			permissions: {}, //TODO once we have per-user, team, org perms
			mode: sharingMode as SharingMode
		},
		...(shareLinkShareId ? { shareLinkShareId } : {})
	});

	if (shareLinkShareId) {
		await updateShareLinkPayload({
			teamId: toObjectId(req.params.resourceSlug),
			shareId: shareLinkShareId,
			payload: {
				id: toObjectId(addedApp?.insertedId)
			}
		});
	}

	return dynamicResponse(
		req,
		res,
		200,
		run
			? { _id: addedApp.insertedId }
			: { _id: addedApp.insertedId, redirect: `/${req.params.resourceSlug}/apps` }
	);
}

/**
 * @api {post} /forms/app/[appId]/edit Edit an app
 * @apiName edit
 * @apiGroup App
 *
 * @apiParam {String} appId App id
 */
export async function editAppApi(req, res, next) {
	const {
		name,
		description,
		process,
		agents,
		memory,
		cache,
		// managerModelId,
		tasks,
		iconId,
		tags,
		conversationStarters,
		toolIds,
		agentId,
		agentName,
		role,
		goal,
		backstory,
		modelId,
		run,
		sharingMode,
		shareLinkShareId,
		verbose
	} = req.body;

	const app = await getAppById(req.params.resourceSlug, req.params.appId); //Note: params dont need validation, theyre checked by the pattern in router
	if (!app) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const isChatApp = app?.type === AppType.CHAT;
	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'sharingMode',
				validation: { notEmpty: true, inSet: new Set(Object.values(SharingMode)) }
			},
			{
				field: 'shareLinkShareId',
				validation: { notEmpty: sharingMode === SharingMode.PUBLIC, ofType: 'string' }
			},
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'description', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'agentName', validation: { notEmpty: isChatApp, ofType: 'string' } },
			{ field: 'modelId', validation: { notEmpty: isChatApp, hasLength: 24, ofType: 'string' } },
			{ field: 'role', validation: { notEmpty: isChatApp, ofType: 'string' } },
			{ field: 'goal', validation: { notEmpty: isChatApp, ofType: 'string' } },
			{ field: 'backstory', validation: { notEmpty: isChatApp, ofType: 'string' } },
			//Note: due to design limitation of validationUtil we need two checks for array fields to both check if theyre empty and validate each array element
			{ field: 'tasks', validation: { notEmpty: !isChatApp } },
			{ field: 'agents', validation: { notEmpty: !isChatApp } },
			{
				field: 'tasks',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Tasks'
				}
			},
			{
				field: 'agents',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Agents'
				}
			},
			// {
			// 	field: 'managerModelId',
			// 	validation: { notEmpty: !isChatApp, hasLength: 24, ofType: 'string' }
			// },
			{
				field: 'toolIds',
				validation: {
					notEmpty: isChatApp,
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Tools'
				}
			},
			{
				field: 'conversationStarters',
				validation: {
					notEmpty: isChatApp,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Conversation Starters'
				}
			}
			//TODO:validation
		],
		{
			name: 'App Name',
			agentName: 'Agent Name',
			modelId: 'Model'
			// managerModelId: 'Chat Manager Model'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	//TODO: refactor and make not mostly duplicated between add and edit APIs
	let chatAgent;
	if (!isChatApp) {
		await updateCrew(req.params.resourceSlug, app.crewId, {
			orgId: res.locals.matchingOrg.id,
			teamId: toObjectId(req.params.resourceSlug),
			name,
			tasks: tasks.map(toObjectId),
			agents: agents.map(toObjectId),
			process,
			verbose
			// managerModelId: toObjectId(managerModelId)
		});
	} else {
		if (agentId) {
			await updateAgent(req.params.resourceSlug, agentId, {
				name: agentName,
				role,
				goal,
				backstory,
				modelId: toObjectId(modelId),
				toolIds: toolIds.map(toObjectId).filter(x => x)
			});
			chatAgent = await getAgentById(req.params.resourceSlug, agentId);
			if (!chatAgent) {
				return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
			}
			const chatAgentModel = await getModelById(req.params.resourceSlug, chatAgent?.modelId);
			if (!chatAgentModel) {
				return dynamicResponse(req, res, 400, { error: 'Agent model invalid or missing' });
			}
			if (
				![ModelType.OPENAI, ModelType.ANTHROPIC, ModelType.GOOGLE_VERTEX].includes(
					chatAgentModel?.type
				)
			) {
				return dynamicResponse(req, res, 400, {
					error: 'Only OpenAI, Anthropic and Google Vertex models are supported for chat apps.'
				});
			}
		} else if (modelId) {
			const foundModel = await getModelById(req.params.resourceSlug, modelId);
			if (!foundModel) {
				return dynamicResponse(req, res, 400, { error: 'Invalid model ID' });
			}
			if (![ModelType.OPENAI, ModelType.ANTHROPIC].includes(foundModel?.type)) {
				return dynamicResponse(req, res, 400, {
					error: 'Only OpenAI and Anthropic models are supported for chat app agents.'
				});
			}
			chatAgent = await addAgent({
				orgId: res.locals.matchingOrg.id,
				teamId: toObjectId(req.params.resourceSlug),
				modelId: toObjectId(modelId),
				toolIds: toolIds.map(toObjectId).filter(x => x),
				name: agentName,
				role,
				goal,
				backstory,
				functionModelId: null,
				maxIter: null,
				maxRPM: null,
				verbose: false,
				allowDelegation: false
			});
		} else {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	}

	const foundIcon = await getAssetById(iconId);

	await updateApp(req.params.resourceSlug, req.params.appId, {
		name,
		description,
		tags: (tags || []).map(tag => tag.trim()).filter(x => x),
		icon: foundIcon
			? {
					id: foundIcon._id,
					filename: foundIcon.filename
				}
			: null,
		...(app.type === AppType.CREW
			? {
					memory: memory === true,
					cache: cache === true
				}
			: {
					chatAppConfig: {
						agentId: toObjectId(agentId),
						conversationStarters: (conversationStarters || []).map(x => x.trim()).filter(x => x)
					}
				}),
		sharingConfig: {
			permissions: {}, //TODO once we have per-user, team, org perms
			mode: sharingMode as SharingMode
		},
		...(shareLinkShareId ? { shareLinkShareId } : {})
	});

	if (shareLinkShareId) {
		await updateShareLinkPayload({
			teamId: toObjectId(req.params.resourceSlug),
			shareId: shareLinkShareId,
			payload: {
				id: toObjectId(req.params.appId)
			}
		});
	}

	return dynamicResponse(req, res, 200, {
		/*redirect: `/${req.params.resourceSlug}/app/${req.params.appId}/edit`*/
	});
}

/**
 * @api {delete} /forms/app/[appId] Delete an app
 * @apiName delete
 * @apiGroup App
 *
 * @apiParam {String} appId App id
 */
export async function deleteAppApi(req, res, next) {
	const { appId } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'appId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
		{
			appId: 'App ID'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	await deleteAppById(req.params.resourceSlug, appId);

	return dynamicResponse(req, res, 302, {});
}
