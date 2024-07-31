'use strict';

import { dynamicResponse } from 'misc/dynamicresponse';

const ONBOARDING_ALLOWED_PATHS = new Set([
	'/onboarding',
	'/onboarding/configuremodels',
	'/account.json', //Account context refreshed from here
	'/team/models.json'
]);

export default async function checkOnboardedStatus(req, res, next) {
	if (req.method === 'GET' && res.locals.account) {
		const desiredPath = req.path; // We don't care about the resourceSlug
		if (!ONBOARDING_ALLOWED_PATHS.has(desiredPath)) {
			if (res.locals.account.onboarded === false) {
				return dynamicResponse(req, res, 302, {
					redirect: `/${res.locals.account.currentTeam.toString()}/onboarding`
				});
			}
		}
	}

	next();
}
