'use strict';

import { getSessionsByTeam, getSessionById, addSession, deleteSessionById } from '../db/session';
import { SessionStatus, SessionType } from '../lib/struct/session';
import { getChatMessagesBySession } from '../db/chat';
import { dynamicResponse } from '../util';

export async function sessionsData(req, res, _next) {
	const sessions = await getSessionsByTeam(res.locals.account.currentTeam);
	return {
		csrf: req.csrfToken(),
		sessions,
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
 * GET /[resourceSlug]/sessions
 * home page html
 */
export async function sessionsPage(app, req, res, next) {
	const data = await sessionsData(req, res, next);
	res.locals.data = {
		...data,
		account: res.locals.account,
	};
	return app.render(req, res, '/[resourceSlug]/sessions');
}

export async function sessionData(req, res, _next) {
	const session = await getSessionById(res.locals.account.currentTeam, req.params.sessionId);
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
		query: {
			resourceSlug: res.locals.account.currentTeam,
			sessionId: req.params.sessionId,
		}
	};
	return app.render(req, res, '/[resourceSlug]/session/[sessionId]');
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
	const messages = await getChatMessagesBySession(res.locals.account.currentTeam, req.params.sessionId);
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

	const { type, prompt }  = req.body;

	if (!prompt || typeof prompt !== 'string' || prompt.length === 0
		|| !type || typeof type !== 'string' || type.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const addedSession = await addSession({
		orgId: res.locals.account.currentOrg,
		teamId: res.locals.account.currentTeam,
	    prompt,
	 	type: type as SessionType,
	    name: '',
	    startDate: new Date(),
    	lastUpdatedDate: new Date(),
	    tokensUsed: 0,
    	agents: [],
		status: SessionStatus.STARTED,
	});

	return dynamicResponse(req, res, 302, { redirect: `/${res.locals.account.currentTeam}/session/${addedSession.insertedId}` });

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

	await deleteSessionById(res.locals.account.currentTeam, sessionId);

	return dynamicResponse(req, res, 200, { /*redirect: `/${res.locals.account.currentTeam}/sessions`*/ });

}
