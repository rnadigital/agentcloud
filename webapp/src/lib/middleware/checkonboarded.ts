'use strict';

import { dynamicResponse } from 'misc/dynamicresponse';

export default async function checkOnboardedStatus(req, res, next) {
	if (req.method === 'GET' && res.locals.account) {
		const desiredPath = req.originalUrl;
		if (!desiredPath.endsWith('/onboarding')) {
			if (res.locals.account.onboarded === false) {
				return dynamicResponse(req, res, 302, {
					redirect: `/${res.locals.account.currentTeam.toString()}/onboarding`
				});
			}
		}
	}

	next();
}
