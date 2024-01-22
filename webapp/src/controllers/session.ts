'use strict';

import toObjectId from 'misc/toobjectid';
import { taskQueue } from 'queue/bull';
import { client } from 'redis/redis';
import { SessionStatus, SessionType } from 'struct/session';

import { getAgentById, getAgentsById, getAgentsByTeam } from '../db/agent';
import { addChatMessage, getChatMessagesBySession } from '../db/chat';
import { getGroupById, getGroupsByTeam } from '../db/group';
import { addSession, deleteSessionById, getSessionById, getSessionsByTeam } from '../db/session';
import { dynamicResponse } from '../util';

export async function sessionsData(req, res, _next) {
	const [groups, sessions, agents] = await Promise.all([
		getGroupsByTeam(req.params.resourceSlug),
		getSessionsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		groups,
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
 * GET /[resourceSlug]/sessions
 * home page html
 */
export async function sessionsPage(app, req, res, next) {
	const data = await sessionsData(req, res, next);
	res.locals.data = {
		...data,
		account: res.locals.account,
	};
	return app.render(req, res, `/${req.params.resourceSlug}/sessions`);
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
		// query: {
		// 	resourceSlug: req.params.resourceSlug,
		// 	sessionId: req.params.sessionId,
		// }
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

	let { rag, prompt }  = req.body;

	if (!prompt || typeof prompt !== 'string' || prompt.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	let groupId = null
		, agentId = null;
	if (req.body.group && typeof req.body.group === 'string' && req.body.group.length === 24) {
		const group = await getGroupById(req.params.resourceSlug, req.body.group);
		if (!group || !group.adminAgent || group.agents.length === 0) {
			return dynamicResponse(req, res, 400, { error: 'Group missing member(s)' });
		}
		const agents = await getAgentsById(req.params.resourceSlug, [group.adminAgent, ...group.agents]);
		if (!agents) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		groupId = group._id;
	} else if (req.body.agent && typeof req.body.agent === 'string' && req.body.agent.length === 24) {
		const agent = await getAgentById(req.params.resourceSlug, req.body.agent);
		if (!agent || !agent.credentialId) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		agentId = agent._id;
	}

	prompt = `${prompt}\n`;

	const sessionType = rag == true ? SessionType.RAG : SessionType.TASK;
	const addedSession = await addSession({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
	    prompt,
	 	type: sessionType,
	    name: '',
	    startDate: new Date(),
    	lastUpdatedDate: new Date(),
	    tokensUsed: 0,
		status: SessionStatus.STARTED,
		groupId,
		agentId,
	});

	const now = Date.now();
	const message = {
		room: addedSession.insertedId.toString(),
		authorName: res.locals.account.name,
		incoming: true,
		message: {
			type: 'text',
			text: prompt,
		},
		event: 'message',
		ts: now
	};
	await addChatMessage({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		sessionId: addedSession.insertedId,
		message,
		type: sessionType,
		authorId: null,
		authorName: res.locals.account.name,
		ts: now,
		isFeedback: false,
		chunkId: null,
		tokens: 0,
		displayMessage: null,
		chunks: [ { ts: now, chunk: prompt, tokens: undefined } ]
	});

	taskQueue.add(sessionType, {
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

	await deleteSessionById(req.params.resourceSlug, sessionId);
	client.set(`${sessionId}_stop`, '1');

	return dynamicResponse(req, res, 200, { /*redirect: `/${req.params.resourceSlug}/sessions`*/ });

}
