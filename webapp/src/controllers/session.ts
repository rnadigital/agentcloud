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
import { getChatMessagesBySession, unsafeGetChatMessagesBySession } from 'db/chat';
import { getCrewById, getCrewsByTeam, unsafeGetCrewById } from 'db/crew';
import {
	addSession,
	deleteSessionById,
	getSessionById,
	getSessionsByTeam,
	setSessionStatus,
	unsafeGetSessionById
} from 'db/session';
import toObjectId from 'misc/toobjectid';
import { taskQueue } from 'queue/bull';
import { client } from 'redis/redis';
import { App, AppType } from 'struct/app';
import { SessionStatus } from 'struct/session';
import { SharingMode } from 'struct/sharing';
import { chainValidations } from 'utils/validationUtils';

export async function sessionsData(req, res, _next) {
	const [crews, sessions, agents] = await Promise.all([
		getCrewsByTeam(req.params.resourceSlug),
		getSessionsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		crews,
		sessions,
		agents
	};
}

/**
 * GET /[resourceSlug]/sessions.json
 * team sessions json data
 */
export async function sessionsJson(req, res, next) {
	const data = await sessionsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

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
				avatarMap = { [foundAgent.name]: foundAgent?.icon?.filename };
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
	const session = await unsafeGetSessionById(req.params.sessionId);
	const app = await unsafeGetAppById(session?.appId);
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
	const data = await sessionData(req, res, next);
	res.locals.data = {
		...data,
		account: null
	};
	return app.render(req, res, `/${req.params.resourceSlug}/session/${req.params.sessionId}`);
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
	let { id: appId, skipRun } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'id', validation: { notEmpty: true, ofType: 'string' } }],
		{ id: 'Id' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const app: App = await getAppById(req.params.resourceSlug, appId);

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
			mode: SharingMode.PUBLIC
		}
	});

	if (!skipRun) {
		taskQueue.add('execute_rag', {
			type: app?.type,
			sessionId: addedSession.insertedId.toString()
		});
	}

	return dynamicResponse(req, res, 302, {
		redirect: `/${req.params.resourceSlug}/session/${addedSession.insertedId}`
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
