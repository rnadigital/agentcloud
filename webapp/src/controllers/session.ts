'use strict';

import { dynamicResponse } from '@dr';
import { getAgentById, getAgentsById, getAgentsByTeam } from 'db/agent';
import { addChatMessage, getChatMessagesBySession } from 'db/chat';
import { getCrewById, getCrewsByTeam } from 'db/crew';
import { setSessionStatus } from 'db/session';
import { addSession, deleteSessionById, getSessionById, getSessionsByTeam } from 'db/session';
import toObjectId from 'misc/toobjectid';
import { taskQueue } from 'queue/bull';
import { client } from 'redis/redis';
import { SessionStatus } from 'struct/session';

export async function sessionsData(req, res, _next) {
	const [crews, sessions, agents] = await Promise.all([
		getCrewsByTeam(req.params.resourceSlug),
		getSessionsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		crews,
		sessions,
		agents,
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

/**
 * GET /[resourceSlug]/playground
 * home page html
 */
export async function sessionsPage(app, req, res, next) {
	const data = await sessionsData(req, res, next);
	res.locals.data = {
		...data,
		account: res.locals.account,
	};
	return app.render(req, res, `/${req.params.resourceSlug}/playground`);
}

export async function sessionData(req, res, _next) {
	const session = await getSessionById(req.params.resourceSlug, req.params.sessionId);
	return {
		csrf: req.csrfToken(),
		session,
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
		account: res.locals.account,
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

/**
 * GET /[resourceSlug]/session/[sessionId]/messages.json
 * get session messages
 */
export async function sessionMessagesJson(req, res, next) {
	const data = await sessionMessagesData(req, res, next);
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

	let { rag, prompt, id }  = req.body;

	let crewId;
	const crew = await getCrewById(req.params.resourceSlug, req.body.id);
	if (crew) {
		const agents = await getAgentsById(req.params.resourceSlug, crew.agents);
		if (!agents) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		crewId = crew._id;
	} else {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const addedSession = await addSession({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
	    // prompt,
	    name: crew.name,
	    startDate: new Date(),
    	lastUpdatedDate: new Date(),
	    tokensUsed: 0,
		status: SessionStatus.STARTED,
		crewId,
	});

	taskQueue.add('execute_rag', { //TODO: figure out room w/ pete
		task: prompt,
		sessionId: addedSession.insertedId.toString(),
	});

	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/session/${addedSession.insertedId}` });

}

/**
 * @api {delete} /forms/session/[sessionId]
 * @apiName delete
 * @apiGroup session
 *
 * @apiParam {String} sessionId the session id
 */
export async function deleteSessionApi(req, res, next) {

	const { sessionId }  = req.body;

	if (!sessionId || typeof sessionId !== 'string' || sessionId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const deletedSession = await deleteSessionById(req.params.resourceSlug, sessionId);
	if (!deletedSession || deletedSession.deletedCount < 1) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	client.set(`${sessionId}_stop`, '1');

	return dynamicResponse(req, res, 200, { /*redirect: `/${req.params.resourceSlug}/playground`*/ });

}

/**
 * @api {post} /forms/session/[sessionId]/cancel
 * @apiName cancel
 * @apiGroup session
 *
 * @apiParam {String} sessionId the session id
 */
export async function cancelSessionApi(req, res, next) {

	const { sessionId }  = req.body;

	if (!sessionId || typeof sessionId !== 'string' || sessionId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const session = await getSessionById(req.params.resourceSlug, req.params.sessionId);
	if (!session) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	await setSessionStatus(req.params.resourceSlug, sessionId, SessionStatus.TERMINATED);
	client.set(`${sessionId}_stop`, '1');

	return dynamicResponse(req, res, 200, { /*redirect: `/${req.params.resourceSlug}/playground`*/ });

}
