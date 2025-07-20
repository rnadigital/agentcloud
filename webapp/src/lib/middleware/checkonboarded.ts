'use strict';

import { dynamicResponse } from 'misc/dynamicresponse';

const ONBOARDING_ALLOWED_PATHS = new Set([
	'/onboarding',
	'/onboarding/configuremodels',
	'/account.json', //Account context refreshed from here
	'/team/models.json',
	'/airbyte/connectors.json',
	'/airbyte/specification'
]);

export default async function checkOnboardedStatus(req, res, next) {
	if (req.method === 'GET' && res.locals.account) {
		const desiredPath = req.path; // We don't care about the resourceSlug

		const originPath = req.headers.referer || '';
		const lastSegment = originPath.split('/').pop();

		// Proceed if the last segment of the originPath includes "onboarding"
		if (lastSegment && lastSegment.includes('onboarding')) {
			return next();
		}

		if (!ONBOARDING_ALLOWED_PATHS.has(desiredPath) && desiredPath !== 'onboarding') {
			if (res.locals.account.onboarded === false) {
				return dynamicResponse(req, res, 302, {
					redirect: `/${res.locals.account.currentTeam.toString()}/onboarding`
				});
			}
		}
	}

	next();
}
