'use strict';

import { dynamicResponse } from '@dr';
import { getAgentById, getAgentsById } from 'db/agent';
import { getAppById } from 'db/app';
import { getCrewById } from 'db/crew';
import { addSession, checkCanAccessApp } from 'db/session';
import { createShareLink, getShareLinkByShareId } from 'db/sharelink';
import { getTaskById } from 'db/task';
import debug from 'debug';
import { chainValidations } from 'lib/utils/validationutils';
import toObjectId from 'misc/toobjectid';
import { sessionTaskQueue } from 'queue/bull';
import { App, AppType } from 'struct/app';
import { SessionStatus } from 'struct/session';
import { ShareLinkTypes } from 'struct/sharelink';
import { SharingMode } from 'struct/sharing';
const log = debug('webapp:controllers:sharelink');

export async function addShareLinkApi(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'type',
				validation: { notEmpty: true, inSet: new Set(Object.values(ShareLinkTypes)) }
			}
		],
		{
			type: 'Type'
		}
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { type } = req.body;

	const addedShareLinkId = await createShareLink({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		type,
		payload: {
			id: null //Note: later when creating a shareable object, this is updated
		}
	});

	return dynamicResponse(req, res, 200, {
		shareLinkId: addedShareLinkId
	});
}

//Note: dont really need other CRUD endpoints for these. They have an index and auto expire

export async function handleRedirect(req, res, next) {
	const { resourceSlug, shareLinkShareId } = req.params;
	const foundShareLink = await getShareLinkByShareId(resourceSlug, shareLinkShareId);

	if (!foundShareLink || !foundShareLink?.payload?.id) {
		//Not found or still no payload set
		return dynamicResponse(req, res, 302, { redirect: '/' });
	}

	const appId = foundShareLink?.payload?.id;
	const app: App = await getAppById(req.params.resourceSlug, appId);

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

	const canAccess = await checkCanAccessApp(app?._id?.toString(), false, res.locals.account);
	if (!canAccess) {
		return next();
	}

	const addedSession = await addSession({
		orgId: toObjectId(app.orgId),
		teamId: toObjectId(resourceSlug),
		name: app.name,
		startDate: new Date(),
		lastUpdatedDate: new Date(),
		tokensUsed: 0,
		status: SessionStatus.STARTED,
		appId: toObjectId(app?._id),
		sharingConfig: {
			permissions: app?.sharingConfig?.permissions,
			mode: app?.sharingConfig?.mode as SharingMode
		}
	});

	if (!hasVariables) {
		sessionTaskQueue.add(
			'execute_rag',
			{
				type: app?.type,
				sessionId: addedSession.insertedId.toString()
			},
			{ removeOnComplete: true, removeOnFail: true }
		);
	}

	switch (foundShareLink.type) {
		case ShareLinkTypes.APP:
		default:
			return dynamicResponse(req, res, 302, {
				redirect: `/s/${resourceSlug}/session/${addedSession.insertedId}`
			});
	}
}
