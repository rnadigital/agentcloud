'use strict';

import { dynamicResponse } from '@dr';
import {
	getAgentById,
	getAgentNameMap,
	getAgentsById,
	getAgentsByTeam,
	unsafeGetAgentNameMap
} from 'db/agent';
import { getAppById, unsafeGetAppById } from 'db/app';
import {
	getChatMessageAfterId,
	getChatMessagesBySession,
	unsafeGetChatMessagesBySession
} from 'db/chat';
import { getCrewById, getCrewsByTeam, unsafeGetCrewById } from 'db/crew';
import {
	addSession,
	deleteSessionById,
	getSessionById,
	getSessionsByTeam,
	setSessionStatus,
	unsafeGetSessionById,
	updateSession
} from 'db/session';
import toObjectId from 'misc/toobjectid';
import { sessionTaskQueue } from 'queue/bull';
import { client } from 'redis/redis';
import { App, AppType } from 'struct/app';
import { SessionStatus } from 'struct/session';
import { SharingMode } from 'struct/sharing';
import { chainValidations } from 'utils/validationutils';

export async function sessionsData(req, res, _next) {
	const before = req?.query?.before === 'null' ? null : req?.query?.before;
	const sessions = await getSessionsByTeam(req.params.resourceSlug, before, 10);
	return {
		csrf: req.csrfToken(),
		sessions
	};
}

/**
 * GET /[resourceSlug]/sessions.json
 * team sessions json data
 */
export async function sessionsJson(req, res, next) {
	let validationError = chainValidations(
		req.query,
		[{ field: 'before', validation: { ofType: 'string' } }],
		{ id: 'before' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}
	const data = await sessionsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export type SessionDataReturnType = Awaited<ReturnType<typeof sessionData>>;

export async function sessionData(req, res, _next) {
	const session = await getSessionById(req.params.resourceSlug, req.params.sessionId);
	const app = await getAppById(req.params.resourceSlug, session?.appId);
	let avatarMap = {};
	switch (app?.type) {
		case AppType.CREW:
			const foundCrew = await getCrewById(req.params.resourceSlug, app?.crewId);
			avatarMap = await getAgentNameMap(req.params.resourceSlug, foundCrew?.agents);
			break;
		case AppType.CHAT:
		default:
			const foundAgent = await getAgentById(req.params.resourceSlug, app?.chatAppConfig.agentId);
			if (foundAgent) {
				avatarMap = { [foundAgent.name.toLowerCase()]: foundAgent?.icon?.filename };
			}
			break;
	}
	return {
		csrf: req.csrfToken(),
		session,
		app,
		avatarMap
	};
}

export async function publicSessionData(req, res, _next) {
	const session = await unsafeGetSessionById(req.params.sessionId || req.query.sessionId);
	const app = await unsafeGetAppById(session?.appId || req.params.appId);
	let avatarMap = {};
	switch (app?.type) {
		case AppType.CREW:
			const foundCrew = await unsafeGetCrewById(app?.crewId);
			avatarMap = await unsafeGetAgentNameMap(foundCrew?.agents);
			break;
		case AppType.CHAT:
		default:
			const foundAgent = await getAgentById(req.params.resourceSlug, app?.chatAppConfig.agentId);
			if (foundAgent) {
				avatarMap = { [foundAgent.name]: foundAgent?.icon?.filename };
			}
			break;
	}
	if (app?.sharingConfig?.mode !== SharingMode.PUBLIC) {
		return; // TODO: make this actually
	}
	return {
		csrf: req.csrfToken(),
		session,
		app,
		avatarMap
	};
}

/**
 * GET /[resourceSlug]/session/[sessionId]
 * session page html
 */
export async function sessionPage(app, req, res, next) {
	const data = await sessionData(req, res, next);
	res.locals.data = {
		...data,
		account: res.locals.account
	};
	return app.render(req, res, `/${req.params.resourceSlug}/session/${req.params.sessionId}`);
}

/**
 * GET /s/session/[sessionId]
 * public session page html
 */
export async function publicSessionPage(app, req, res, next) {
	const data = await publicSessionData(req, res, next);
	if (!data) {
		return next(); //404
	}
	res.locals.data = {
		...data,
		account: null
	};
	return app.render(req, res, `/${req.params.resourceSlug}/session/${data.session._id}`);
}

/**
 * GET /[resourceSlug]/session/[sessionId].json
 * get session json
 */
export async function sessionJson(req, res, next) {
	const data = await sessionData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function sessionMessagesData(req, res, _next) {
	const messages = await getChatMessagesBySession(req.params.resourceSlug, req.params.sessionId);
	return messages;
}

export async function publicSessionMessagesData(req, res, _next) {
	const messages = await unsafeGetChatMessagesBySession(req.params.sessionId);
	return messages;
}

/**
 * GET /[resourceSlug]/session/[sessionId]/messages.json
 * get session messages
 */
export async function sessionMessagesJson(req, res, next) {
	if (req?.query?.messageId) {
		let validationError = chainValidations(
			req?.query,
			[{ field: 'messageId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
			{ messageId: 'Message ID' }
		);

		if (validationError) {
			return dynamicResponse(req, res, 400, { error: validationError });
		}

		const messages = await getChatMessageAfterId(
			req.params.resourceSlug,
			req.params.sessionId,
			req.query.messageId
		);
		return res.json(messages);
	}
	const data = await sessionMessagesData(req, res, next);
	return res.json(data);
}

/**
 * GET /[resourceSlug]/session/[sessionId]/messages.json
 * get session messages
 */
export async function publicSessionMessagesJson(req, res, next) {
	const data = await publicSessionMessagesData(req, res, next);
	return res.json(data);
}

/**
 * @api {post} /forms/session/add Add a session
 * @apiName add
 * @apiGroup session
 *
 * @apiParam {String} prompt The prompt text
 * @apiParam {String} type team | task Type of session
 */
export async function addSessionApi(req, res, next) {
	let { id: appId, skipRun, variables } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'id', validation: { notEmpty: true, ofType: 'string' } }],
		{ id: 'Id' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const app: App = await getAppById(req.params.resourceSlug, appId);

	//TODO: check if anonymous/public chat app and reject if sharing mode isnt public

	if (!app) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//TODO: Rewrite this to check all dependencies of reusable properties of apps/crews
	let crewId;
	let agentId;
	if (app?.type === AppType.CREW) {
		const crew = await getCrewById(req.params.resourceSlug, app?.crewId);
		if (crew) {
			const agents = await getAgentsById(req.params.resourceSlug, crew.agents);
			if (!agents) {
				return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
			}
			crewId = crew._id;
		} else {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	} else {
		const agent = await getAgentById(req.params.resourceSlug, app?.chatAppConfig?.agentId);
		if (!agent) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	}

	const addedSession = await addSession({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: app.name,
		startDate: new Date(),
		lastUpdatedDate: new Date(),
		tokensUsed: 0,
		status: SessionStatus.STARTED,
		appId: toObjectId(app?._id),
		sharingConfig: {
			permissions: {},
			mode: app?.sharingConfig?.mode
		},
		variables
	});

	if (!skipRun && !variables) {
		sessionTaskQueue.add(
			'execute_rag',
			{
				type: app?.type,
				sessionId: addedSession.insertedId.toString()
			},
			{ removeOnComplete: true, removeOnFail: true }
		);
	}

	let redirectUrl = `/${req.params.resourceSlug}/session/${addedSession.insertedId}`;
	const searchParams = new URLSearchParams();

	if (variables) {
		app.variables.forEach(variable => {
			searchParams.set(variable.name, variable.defaultValue);
		});
	}

	redirectUrl += `?${searchParams.toString()}`;

	return dynamicResponse(req, res, 302, {
		redirect: redirectUrl
	});
}

/**
 * @api {delete} /forms/session/[sessionId]
 * @apiName delete
 * @apiGroup session
 *
 * @apiParam {String} sessionId the session id
 */
export async function deleteSessionApi(req, res, next) {
	const { sessionId } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'sessionId', validation: { notEmpty: true, ofType: 'string' } }],
		{ sessionId: 'Session ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (!sessionId || typeof sessionId !== 'string' || sessionId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const deletedSession = await deleteSessionById(req.params.resourceSlug, sessionId);
	if (!deletedSession || deletedSession.deletedCount < 1) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	client.set(`${sessionId}_stop`, '1');

	return dynamicResponse(req, res, 200, {
		/*redirect: `/${req.params.resourceSlug}/apps`*/
	});
}

/**
 * @api {post} /forms/session/[sessionId]/cancel
 * @apiName cancel
 * @apiGroup session
 *
 * @apiParam {String} sessionId the session id
 */
export async function cancelSessionApi(req, res, next) {
	const { sessionId } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'sessionId', validation: { notEmpty: true, ofType: 'string', lengthMin: 24 } }],
		{ sessionId: 'Session ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const session = await getSessionById(req.params.resourceSlug, req.params.sessionId);
	if (!session) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	await setSessionStatus(req.params.resourceSlug, sessionId, SessionStatus.TERMINATED);
	client.set(`${sessionId}_stop`, '1');

	return dynamicResponse(req, res, 200, {
		/*redirect: `/${req.params.resourceSlug}/apps`*/
	});
}

export async function editSessionApi(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { ofType: 'string' } },
			{ field: 'status', validation: { ofType: 'string' } },
			{ field: 'appId', validation: { ofType: 'string' } },
			{ field: 'previewLabel', validation: { ofType: 'string' } },
			{ field: 'sharingConfig', validation: { ofType: 'object' } },
			{ field: 'variables', validation: { ofType: 'object' } }
		],
		{
			name: 'Name',
			status: 'Status',
			appId: 'App ID',
			previewLabel: 'Preview Label',
			sharingConfig: 'Sharing Config',
			variables: 'Variables'
		}
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const sessionId = req.params.sessionId;

	const payload = {
		orgId: req.body?.orgId,
		teamId: req.body?.teamId,
		name: req.body?.name,
		status: req.body?.status,
		appId: req.body?.appId,
		sharingConfig: req.body?.sharingConfig,
		variables: req.body?.variables
	};

	const updatedSession = await updateSession(req.params.resourceSlug, sessionId, payload);

	if (!updatedSession) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	return dynamicResponse(req, res, 200, {
		message: 'Session updated successfully',
		session: updatedSession
	});
}

export async function startSession(req, res, next) {
	sessionTaskQueue.add(
		'execute_rag',
		{
			type: req.body.appType,
			sessionId: req.body.sessionId
		},
		{ removeOnComplete: true, removeOnFail: true }
	);

	return dynamicResponse(req, res, 200, {
		message: 'Session started successfully'
	});
}
