'use strict';

import { dynamicResponse } from '@dr';
import { createShareLink } from 'db/sharelink';
import { chainValidations } from 'lib/utils/validationUtils';
import toObjectId from 'misc/toobjectid';
import { ShareLinkTypes } from 'struct/sharelink';

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
