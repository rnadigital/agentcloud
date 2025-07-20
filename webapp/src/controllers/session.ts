'use strict';

import { dynamicResponse } from '@dr';
import { activeSessionRooms, io } from '@socketio';
import {
	getAgentById,
	getAgentNameMap,
	getAgentsById,
	getAgentsByTeam,
	unsafeGetAgentNameMap
} from 'db/agent';
import { getAppById, getAppsByTeam, unsafeGetAppById } from 'db/app';
import {
	ChatChunk,
	getChatMessageAfterId,
	getChatMessagesBySession,
	unsafeGetChatMessagesBySession,
	upsertOrUpdateChatMessage
} from 'db/chat';
import { getCrewById, getCrewsByTeam, unsafeGetCrewById } from 'db/crew';
import {
	addSession,
	checkCanAccessApp,
	deleteSessionById,
	getSessionById,
	getSessionsByTeam,
	setSessionStatus,
	unsafeGetSessionById,
	updateSession
} from 'db/session';
import { getTaskById } from 'db/task';
import { getVariableById } from 'db/variable';
import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { sessionTaskQueue } from 'queue/bull';
import { client } from 'redis/redis';
import { v4 as uuidv4 } from 'uuid';
const log = debug('webapp:controllers:session');
import { App, AppType } from 'struct/app';
import { SessionStatus } from 'struct/session';
import { Variable } from 'struct/variable';
import { chainValidations } from 'utils/validationutils';

export async function sessionsData(req, res, _next) {
	const before = req?.query?.before === 'null' ? null : req?.query?.before;
	const sessions = await getSessionsByTeam(req.params.resourceSlug, before, 10);
	const apps = await getAppsByTeam(req.params.resourceSlug);

	const sessionsWithApps = sessions.map(session => {
		const app = apps.find(app => app._id.equals(session.appId));
		return { ...session, app };
	});
	return {
		csrf: req.csrfToken(),
		sessions: sessionsWithApps
	};
}

/**
 * GET /[resourceSlug]/sessions.json
 * team sessions json data
 */
export type SessionJSONReturnType = Awaited<ReturnType<typeof sessionsData>>;
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

			const taskPromises = foundCrew.tasks.map(t =>
				getTaskById(req.params.resourceSlug, t.toString())
			);

			const tasks = await Promise.all(taskPromises);

			const crewAppVariables: Variable[] = [];
			for (const task of tasks) {
				const variablePromise = task.variableIds.map(v =>
					getVariableById(req.params.resourceSlug, v)
				);
				const variables = await Promise.all(variablePromise);

				variables.forEach(variable => {
					if (variable && !crewAppVariables.some(v => (v._id as ObjectId).equals(variable._id))) {
						crewAppVariables.push(variable);
					}
				});
			}

			const agentPromises = foundCrew.agents.map(a =>
				getAgentById(req.params.resourceSlug, a.toString())
			);

			const agents = await Promise.all(agentPromises);

			for (const agent of agents) {
				if (agent?.variableIds) {
					const variablePromise = agent?.variableIds.map(v =>
						getVariableById(req.params.resourceSlug, v)
					);
					const variables = await Promise.all(variablePromise);
					crewAppVariables.push(...variables);
				}
			}
			if (crewAppVariables.length > 0) {
				app.variables = crewAppVariables.map(v => ({
					name: v.name,
					defaultValue: v.defaultValue,
					id: toObjectId(v._id)
				}));
			}

			avatarMap = await getAgentNameMap(req.params.resourceSlug, foundCrew?.agents);
			break;
		case AppType.CHAT:
		default:
			const foundAgent = await getAgentById(req.params.resourceSlug, app?.chatAppConfig.agentId);
			if (foundAgent) {
				avatarMap = { [foundAgent.name.toLowerCase()]: foundAgent?.icon?.filename };
				const variablePromise = (foundAgent?.variableIds || []).map(v =>
					getVariableById(req.params.resourceSlug, v)
				);
				const chatAppVariables = await Promise.all(variablePromise);
				app.variables = chatAppVariables.map(v => ({
					name: v.name,
					defaultValue: v.defaultValue,
					id: toObjectId(v._id)
				}));
			}
			break;
	}
	return {
		csrf: req.csrfToken(),
		session,
		app: app as App,
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
	const canAccess = await checkCanAccessApp(app?._id?.toString(), false, res.locals.account);
	if (!canAccess) {
		return null;
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
		return next();
	}
	res.locals.data = {
		...data,
		account: null
	};
	return app.render(req, res, `/${req.params.resourceSlug}/session/${data.session._id}`);
}

export type SessionJsonReturnType = Awaited<ReturnType<typeof sessionData>>;
/**
 * GET /[resourceSlug]/session/[sessionId].json
 * get session json
 */
export async function sessionJson(req, res, next) {
	const data = await sessionData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function publicSessionJson(req, res, next) {
	const data = await publicSessionData(req, res, next);
	if (!data) {
		return next();
	}
	return res.json({ ...data, account: res.locals.account });
}

export async function sessionMessagesData(req, res, _next) {
	const messages = await getChatMessagesBySession(req.params.resourceSlug, req.params.sessionId);
	return messages;
}

export async function publicSessionMessagesData(req, res, _next) {
	const session = await unsafeGetSessionById(req.params.sessionId);
	const canAccess = await checkCanAccessApp(session?.appId?.toString(), false, res.locals.account);
	if (!canAccess) {
		return null;
	}
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

	//TODO: a cleaner way to do this, but it only works for Chat apps anyway. This is OK for now.
	const sessionId = req.params.sessionId.toString();
	const session = await unsafeGetSessionById(sessionId);
	const app = await unsafeGetAppById(session?.appId);

	if (app.type === AppType.CHAT) {
		const agent = await getAgentById(req.params.resourceSlug, app.chatAppConfig.agentId);
		if (agent?.variableIds) {
			if (agent?.variableIds.length === 0) {
				log('activeSessionRooms in getsessionmessagesjson', activeSessionRooms);
				if (!activeSessionRooms.includes(`_${sessionId}`)) {
					log('Resuming session', sessionId);
					activeSessionRooms.push(`_${sessionId}`);
					sessionTaskQueue.add(
						'execute_rag',
						{
							type: 'chat',
							sessionId
						},
						{ removeOnComplete: true, removeOnFail: true }
					);
				}
			}
		} else {
			log('activeSessionRooms in getsessionmessagesjson', activeSessionRooms);
			if (!activeSessionRooms.includes(`_${sessionId}`)) {
				log('Resuming session', sessionId);
				activeSessionRooms.push(`_${sessionId}`);
				sessionTaskQueue.add(
					'execute_rag',
					{
						type: 'chat',
						sessionId
					},
					{ removeOnComplete: true, removeOnFail: true }
				);
			}
		}
	}

	return res.json(data);
}

/**
 * GET /[resourceSlug]/session/[sessionId]/messages.json
 * get session messages
 */
export async function publicSessionMessagesJson(req, res, next) {
	const data = await publicSessionMessagesData(req, res, next);
	if (!data) {
		return next();
	}
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

	//TODO: check if anonymous/public chat app and reject if sharing mode isnt public

	if (!app) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	let crewId;
	let hasVariables = false;

	if (app?.type === AppType.CREW) {
		const crew = await getCrewById(req.params.resourceSlug, app?.crewId);
		if (!crew) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		crewId = crew._id;

		const kickOffVariablesIds = app.kickOffVariablesIds?.map(v => v.toString()) || [];
		const agents = await getAgentsById(req.params.resourceSlug, crew.agents);
		if (!agents) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}

		const agentVariableIds = agents.flatMap(a => a.variableIds.map(v => v.toString()));
		hasVariables = agentVariableIds.some(v => kickOffVariablesIds.includes(v));

		if (!hasVariables) {
			const tasks = await Promise.all(
				crew.tasks.map(t => getTaskById(req.params.resourceSlug, t.toString()))
			);
			const taskVariableIds = tasks.flatMap(t => t.variableIds.map(v => v.toString()));
			hasVariables = taskVariableIds.some(v => kickOffVariablesIds.includes(v));
		}
	} else {
		const agent = await getAgentById(req.params.resourceSlug, app?.chatAppConfig?.agentId);
		if (!agent) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		hasVariables = agent.variableIds?.length > 0;
	}

	const addedSession = await addSession({
		orgId: toObjectId(res.locals.matchingOrg.id),
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
		}
	});

	if (!skipRun && !hasVariables) {
		const newSessionId = addedSession.insertedId.toString();
		activeSessionRooms.push(`_${newSessionId}`);
		sessionTaskQueue.add(
			'execute_rag',
			{
				type: app?.type,
				sessionId: newSessionId
			},
			{ removeOnComplete: true, removeOnFail: true }
		);
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

	//TODO: CLOSE MONGO CONNECTION IN AGENT_BACKEND IF IT ISN'T ALREADY CLOSED

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
	const session = await unsafeGetSessionById(req.body.sessionId);
	const canAccess = await checkCanAccessApp(session?.appId?.toString(), false, res.locals.account);
	if (!canAccess) {
		return dynamicResponse(req, res, 400, {
			error: 'No permission'
		});
	}

	let validationError = chainValidations(
		req.body,
		[
			// { field: 'name', validation: { ofType: 'string' } },
			// { field: 'status', validation: { ofType: 'string' } },
			// { field: 'appId', validation: { ofType: 'string' } },
			// { field: 'previewLabel', validation: { ofType: 'string' } },
			// { field: 'sharingConfig', validation: { ofType: 'object' } },
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
		// name: req.body?.name,
		// status: req.body?.status,
		// appId: req.body?.appId,
		// sharingConfig: req.body?.sharingConfig,
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

export async function sendMessage(req, res, next) {
	try {
		const { sessionId } = req.params;
		const { messageText } = req.body;
		log(
			`Sending message with found req.params = ${req.params.sessionId}\nand req.body.messageText = ${req.body.messageText}\nand req.body.sessionId = ${req.body.sessionId}`
		);

		let validationError = chainValidations(
			req.body,
			[
				{
					field: 'messageText',
					validation: { notEmpty: true, ofType: 'string' }
				}
			],
			{
				messageText: 'Message Text'
			}
		);

		if (validationError) {
			return dynamicResponse(req, res, 400, { error: validationError });
		}

		const session = await unsafeGetSessionById(sessionId);
		if (!session) {
			return dynamicResponse(req, res, 400, { error: 'Session not found' });
		}

		const activeRoomSessionId = `_${sessionId}`;

		if (!activeSessionRooms.includes(activeRoomSessionId)) {
			activeSessionRooms.forEach(v => {
				log(`roomId: ${v}`);
			});
			return dynamicResponse(req, res, 400, {
				error: 'Attempting to send message to inactive session.'
			});
		}

		const messagePayload = {
			room: activeRoomSessionId,
			authorName: res.locals?.account?.name || 'External API',
			message: {
				type: 'text',
				text: messageText
			},
			event: 'message'
		};

		const message = messagePayload.message;

		const messageTimestamp = Date.now();

		const authorName = res.locals?.account?.name || 'External API';

		const finalMessage = {
			...messagePayload,
			message: {
				...message,
				chunkId: uuidv4()
			},
			incoming: true,
			authorName,
			ts: messageTimestamp
		};

		const chunk: ChatChunk = {
			ts: finalMessage.ts,
			chunk: finalMessage.message.text,
			tokens: 0
		};

		const updatedMessage = {
			orgId: session.orgId,
			teamId: session.teamId,
			sessionId: session._id,
			authorId: null,
			authorName: finalMessage.authorName,
			ts: finalMessage.ts || messageTimestamp,
			isFeedback: false,
			chunkId: finalMessage.message.chunkId || null,
			message: finalMessage
		};
		await upsertOrUpdateChatMessage(session._id, updatedMessage, chunk);

		io.to(activeRoomSessionId).emit('message', messagePayload);

		// // Persist the message in the database
		// await upsertOrUpdateChatMessage(sessionId, {
		// 	orgId: session.orgId,
		// 	teamId: session.teamId,
		// 	sessionId: session._id,
		// 	authorId: res.locals?.account?._id || null, // API-triggered, no user ID
		// 	authorName: res.locals?.account?.name || "External API",
		// 	ts: Date.now(),
		// 	message: messagePayload.message
		// }, {
		// 	ts: Date.now(),
		// 	chunk: messagePayload.message,
		// 	tokens: 0 // Update if tokenization is relevant
		// });

		return dynamicResponse(req, res, 200, {
			message: 'Message sent successfully'
		});
	} catch (error) {
		console.error(error);
		return dynamicResponse(req, res, 500, {
			error: 'Internal server error'
		});
	}
}

export async function startSession(req, res, next) {
	const session = await unsafeGetSessionById(req.body.sessionId);
	const canAccess = await checkCanAccessApp(session?.appId?.toString(), false, res.locals.account);
	if (!canAccess) {
		return dynamicResponse(req, res, 400, {
			error: 'No permission'
		});
	}

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
