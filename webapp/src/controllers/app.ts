'use strict';

import { dynamicResponse } from '@dr';
import { cloneAssetInStorageProvider } from 'controllers/asset';
import { getAccountByEmail, getAccountsById } from 'db/account';
import { addAgent, getAgentById, getAgentsByTeam, updateAgent } from 'db/agent';
import {
	addApp,
	deleteAppById,
	deleteAppByIdReturnApp,
	getAppById,
	getAppsByTeam,
	updateApp,
	updateAppGetOldApp
} from 'db/app';
import { attachAssetToObject, deleteAssetById } from 'db/asset';
import { addCrew, deleteCrewById, updateCrew } from 'db/crew';
import { getDatasourcesByTeam } from 'db/datasource';
import { getModelById, getModelsByTeam } from 'db/model';
import { updateShareLinkPayload } from 'db/sharelink';
import { getTasksByTeam } from 'db/task';
import { getToolsByTeam } from 'db/tool';
import { getVariablesByTeam } from 'db/variable';
import createAccount from 'lib/account/create';
import { chainValidations } from 'lib/utils/validationutils';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { AppType } from 'struct/app';
import { IconAttachment } from 'struct/asset';
import { CollectionName } from 'struct/db';
import { ChatAppAllowedModels } from 'struct/model';
import { SharingMode } from 'struct/sharing';

export type AppsDataReturnType = Awaited<ReturnType<typeof appsData>>;
import { ProcessImpl } from '../lib/struct/crew';

export async function appsData(req, res, _next) {
	const [apps, tasks, tools, agents, models, datasources, variables, teamMembers] =
		await Promise.all([
			getAppsByTeam(req.params.resourceSlug),
			getTasksByTeam(req.params.resourceSlug),
			getToolsByTeam(req.params.resourceSlug),
			getAgentsByTeam(req.params.resourceSlug),
			getModelsByTeam(req.params.resourceSlug),
			getDatasourcesByTeam(req.params.resourceSlug),
			getVariablesByTeam(req.params.resourceSlug),
			getAccountsById(res.locals.matchingTeam.members)
		]);

	const teamMemberemails = teamMembers.reduce((acc, curr) => {
		//get AccountsById gets the entire account object, which we don't need so we extract the emails from them
		acc.push(curr.email);
		return acc;
	}, []);

	return {
		csrf: req.csrfToken(),
		apps,
		tasks,
		tools,
		agents,
		models,
		datasources,
		teamMembers: teamMemberemails,
		variables
	};
}

export async function appData(req, res, _next) {
	const [app, tasks, tools, agents, models, datasources, teamMembers, variables] =
		await Promise.all([
			getAppById(req.params.resourceSlug, req.params.appId),
			getTasksByTeam(req.params.resourceSlug),
			getToolsByTeam(req.params.resourceSlug),
			getAgentsByTeam(req.params.resourceSlug),
			getModelsByTeam(req.params.resourceSlug),
			getDatasourcesByTeam(req.params.resourceSlug),
			getAccountsById(res.locals.matchingTeam.members),
			getVariablesByTeam(req.params.resourceSlug)
		]);

	const teamMemberemails = teamMembers.reduce((acc, curr) => {
		//get AccountsById gets the entire account object, which we don't need so we extract the emails from them
		acc.push(curr.email);
		return acc;
	}, []);
	return {
		csrf: req.csrfToken(),
		app,
		tasks,
		tools,
		agents,
		models,
		datasources,
		teamMembers: teamMemberemails,
		variables
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
		managerModelId,
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
		sharingEmails,
		shareLinkShareId,
		verbose,
		fullOutput,
		recursionLimit,
		cloning,
		maxMessages,
		variableIds,
		kickOffVariablesIds
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
				validation: { notEmpty: sharingMode !== SharingMode.TEAM, ofType: 'string' }
			},
			{
				field: 'sharingEmails',
				validation: {
					notEmpty: true,
					asArray: true,
					ofType: 'string'
				},
				validateIf: { field: 'sharingMode', condition: value => value === SharingMode.WHITELIST }
			},
			{
				field: 'type',
				validation: { notEmpty: true, inSet: new Set([AppType.CHAT, AppType.CREW]) }
			},
			// { field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			// { field: 'description', validation: { notEmpty: true, ofType: 'string' } },
			// { field: 'agentName', validation: { notEmpty: isChatApp, ofType: 'string' } },
			// { field: 'modelId', validation: { notEmpty: isChatApp, hasLength: 24, ofType: 'string' } },
			// { field: 'role', validation: { notEmpty: isChatApp, ofType: 'string' } },
			// { field: 'goal', validation: { notEmpty: isChatApp, ofType: 'string' } },
			// { field: 'backstory', validation: { notEmpty: isChatApp, ofType: 'string' } },
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
			{
				field: 'managerModelId',
				validation: { notEmpty: true, hasLength: 24, ofType: 'string' },
				validateIf: {
					field: 'sharingMode',
					condition: () => {
						return !isChatApp && process === ProcessImpl.HIERARCHICAL;
					}
				}
			},
			// {
			// 	field: 'toolIds',
			// 	validation: {
			// 		notEmpty: isChatApp,
			// 		hasLength: 24,
			// 		asArray: true,
			// 		ofType: 'string',
			// 		customError: 'Invalid Tools'
			// 	}
			// },
			{
				field: 'conversationStarters',
				validation: {
					notEmpty: isChatApp,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Conversation Starters'
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
			//TODO:validation
		],
		{
			name: 'App Name',
			agentName: 'Agent Name',
			modelId: 'Model',
			managerModelId: 'Chat Manager Model'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const newAppId = new ObjectId();
	const collectionType = CollectionName.Apps;
	let attachedIconToApp = await cloneAssetInStorageProvider(
		toObjectId(iconId),
		cloning,
		toObjectId(newAppId),
		collectionType,
		req.params.resourceSlug
	);

	let addedCrew, chatAgent;
	if ((type as AppType) === AppType.CREW) {
		addedCrew = await addCrew({
			orgId: res.locals.matchingOrg.id,
			teamId: toObjectId(req.params.resourceSlug),
			name,
			tasks: tasks.map(toObjectId),
			agents: agents.map(toObjectId),
			process,
			verbose,
			fullOutput: fullOutput === true,
			managerModelId: managerModelId ? toObjectId(managerModelId) : null
		});
	} else {
		if (agentId) {
			const chatAgent = await getAgentById(req.params.resourceSlug, agentId);
			if (!chatAgent) {
				return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
			}
			const chatAgentModel = await getModelById(req.params.resourceSlug, chatAgent?.modelId);
			if (!chatAgentModel) {
				return dynamicResponse(req, res, 400, { error: 'Agent model invalid or missing' });
			}
			if (!ChatAppAllowedModels.has(chatAgentModel?.type)) {
				return dynamicResponse(req, res, 400, {
					error:
						'Only OpenAI, Azure OpenAI, Anthropic, Google, Groq and Ollama models are supported for chat apps.'
				});
			}
		} else {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	}

	const sharePermissions = await getSharePermissions(req, res);

	const addedApp = await addApp({
		_id: newAppId,
		createdBy: res.locals.account._id,
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		tags: (tags || []).map(tag => tag.trim()).filter(x => x),
		author: res.locals.matchingTeam.name,
		icon: attachedIconToApp
			? {
					id: attachedIconToApp._id,
					filename: attachedIconToApp.filename,
					linkedId: newAppId
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
						conversationStarters: (conversationStarters || []).map(x => x.trim()).filter(x => x),
						maxMessages
					}
				}),
		sharingConfig: {
			permissions: sharePermissions,
			mode: sharingMode as SharingMode
		},
		...(shareLinkShareId ? { shareLinkShareId } : {}),
		kickOffVariablesIds: kickOffVariablesIds?.map(v => toObjectId(v))
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
		managerModelId,
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
		sharingEmails,
		shareLinkShareId,
		verbose,
		fullOutput,
		recursionLimit,
		maxMessages,
		variableIds,
		kickOffVariablesIds
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
				validation: { notEmpty: sharingMode !== SharingMode.TEAM, ofType: 'string' }
			},
			{
				field: 'sharingEmails',
				validation: {
					notEmpty: true,
					asArray: true,
					ofType: 'string'
				},
				validateIf: { field: 'sharingMode', condition: value => value === SharingMode.WHITELIST }
			},
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'description', validation: { notEmpty: true, ofType: 'string' } },
			// { field: 'agentName', validation: { notEmpty: isChatApp, ofType: 'string' } },
			// { field: 'modelId', validation: { notEmpty: isChatApp, hasLength: 24, ofType: 'string' } },
			// { field: 'role', validation: { notEmpty: isChatApp, ofType: 'string' } },
			// { field: 'goal', validation: { notEmpty: isChatApp, ofType: 'string' } },
			// { field: 'backstory', validation: { notEmpty: isChatApp, ofType: 'string' } },
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
			// 	validation: { notEmpty: true, hasLength: 24, ofType: 'string' },
			// 	validateIf: {
			// 		field: 'sharingMode',
			// 		condition: () => {
			// 			return !isChatApp && process === ProcessImpl.HIERARCHICAL;
			// 		}
			// 	}
			// },
			// {
			// 	field: 'toolIds',
			// 	validation: {
			// 		notEmpty: isChatApp,
			// 		hasLength: 24,
			// 		asArray: true,
			// 		ofType: 'string',
			// 		customError: 'Invalid Tools'
			// 	}
			// },
			{
				field: 'conversationStarters',
				validation: {
					notEmpty: isChatApp,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Conversation Starters'
				}
			}
			// {
			// 	field: 'variableIds',
			// 	validation: {
			// 		hasLength: 24,
			// 		asArray: true,
			// 		ofType: 'string',
			// 		customError: 'Invalid Variables'
			// 	}
			// }
			//TODO:validation
		],
		{
			name: 'App Name',
			agentName: 'Agent Name',
			modelId: 'Model',
			managerModelId: 'Chat Manager Model'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	//TODO: refactor and make not mostly duplicated between add and edit APIs
	// let chatAgent;
	if (!isChatApp) {
		await updateCrew(req.params.resourceSlug, app.crewId, {
			orgId: res.locals.matchingOrg.id,
			teamId: toObjectId(req.params.resourceSlug),
			name,
			tasks: tasks.map(toObjectId),
			agents: agents.map(toObjectId),
			process,
			verbose,
			fullOutput: fullOutput === true,
			managerModelId: managerModelId ? toObjectId(managerModelId) : null
		});
	} else {
		if (agentId) {
			const chatAgent = await getAgentById(req.params.resourceSlug, agentId);
			if (!chatAgent) {
				return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
			}
			const chatAgentModel = await getModelById(req.params.resourceSlug, chatAgent?.modelId);
			if (!chatAgentModel) {
				return dynamicResponse(req, res, 400, { error: 'Agent model invalid or missing' });
			}
			if (!ChatAppAllowedModels.has(chatAgentModel?.type)) {
				return dynamicResponse(req, res, 400, {
					error:
						'Only OpenAI, Azure OpenAI, Anthropic, Google, Groq and Ollama models are supported for chat apps.'
				});
			}
		} else {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	}

	const sharePermissions = await getSharePermissions(req, res);

	let attachedIconToApp: IconAttachment = app?.icon;
	if (app?.icon?.id?.toString() !== iconId) {
		const collectionType = CollectionName.Apps;
		const newAttachment = await attachAssetToObject(iconId, req.params.appId, collectionType);
		if (newAttachment) {
			attachedIconToApp = {
				id: newAttachment._id,
				filename: newAttachment.filename,
				linkedId: newAttachment.linkedToId
			};
		}
	}

	const oldApp = await updateAppGetOldApp(req.params.resourceSlug, req.params.appId, {
		name,
		description,
		tags: (tags || []).map(tag => tag.trim()).filter(x => x),
		icon: iconId ? attachedIconToApp : null,
		...(app.type === AppType.CREW
			? {
					memory: memory === true,
					cache: cache === true
				}
			: {
					chatAppConfig: {
						agentId: toObjectId(agentId),
						conversationStarters: (conversationStarters || []).map(x => x.trim()).filter(x => x),
						maxMessages
					}
				}),
		sharingConfig: {
			permissions: sharePermissions,
			mode: sharingMode as SharingMode
		},
		...(shareLinkShareId ? { shareLinkShareId } : {}),
		kickOffVariablesIds: kickOffVariablesIds?.map(v => toObjectId(v))
	});

	if (oldApp?.icon?.id && oldApp?.icon?.id?.toString() !== iconId) {
		deleteAssetById(oldApp?.icon.id);
	}

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

	const oldApp = await deleteAppByIdReturnApp(req.params.resourceSlug, appId);
	if (oldApp?.crewId) {
		await deleteCrewById(req.params.resourceSlug, oldApp?.crewId);
	}
	if (oldApp?.icon) {
		await deleteAssetById(oldApp.icon.id);
	}

	return dynamicResponse(req, res, 302, {});
}

//TODO: move
export async function getSharePermissions(req, res) {
	const { sharingEmails } = req.body;
	const sharePermissions = {};
	await Promise.all(
		(sharingEmails || []).map(async em => {
			let foundAccount = await getAccountByEmail(em);
			const invitingTeam = res.locals.matchingOrg.teams.find(
				t => t.id.toString() === req.params.resourceSlug
			);
			if (!foundAccount) {
				const { addedAccount } = await createAccount({
					email: em,
					name: em //TODO: some way to let them set their name on login
				});
				foundAccount = await getAccountByEmail(em);
			}
			sharePermissions[foundAccount?._id.toString()] = em; //TODO: not put emails here, but it will be less efficient on the frontend otherwise
		})
	);
	return sharePermissions;
}
