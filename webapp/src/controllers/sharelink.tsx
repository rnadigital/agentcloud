'use strict';

import { dynamicResponse } from '@dr';
import { getAgentById, getAgentsById } from 'db/agent';
import { getAppById } from 'db/app';
import { getCrewById } from 'db/crew';
import { addSession } from 'db/session';
import { createShareLink, getShareLinkByShareId } from 'db/sharelink';
import debug from 'debug';
import { chainValidations } from 'lib/utils/validationutils';
import toObjectId from 'misc/toobjectid';
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
		orgId: toObjectId(app.orgId),
		teamId: toObjectId(resourceSlug),
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
	const sessionId = addedSession.insertedId;

	switch (foundShareLink.type) {
		case ShareLinkTypes.APP:
		default:
			//There are no other sharinglinktypes yet
			return dynamicResponse(req, res, 302, {
				redirect: `/s/${resourceSlug}/app/${foundShareLink.payload.id}?sessionId=${sessionId}`
			});
	}
}
