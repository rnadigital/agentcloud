'use strict';

import { dynamicResponse } from '@dr';
import { createShareLink, getShareLinkByShareId } from 'db/sharelink';
import debug from 'debug';
import { chainValidations } from 'lib/utils/validationUtils';
import toObjectId from 'misc/toobjectid';
import { ShareLinkTypes } from 'struct/sharelink';
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
	log('resourceSlug: %s, shareLinkShareId: %s', resourceSlug, shareLinkShareId);
	log('foundShareLink: %s', foundShareLink);
	if (!foundShareLink || !foundShareLink?.payload?.id) {
		//Not found or still no payload set
		return dynamicResponse(req, res, 302, { redirect: '/' });
	}
	switch (foundShareLink.type) {
		case ShareLinkTypes.APP:
		default:
			//There are no other sharinglinktypes yet
			return dynamicResponse(req, res, 302, {
				redirect: `/s/${resourceSlug}/app/${foundShareLink.payload.id}`
			});
	}
}
