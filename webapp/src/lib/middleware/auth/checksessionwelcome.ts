'use strict';

import { dynamicResponse } from '@dr';

export default function checkSessionWelcome(req, res, next) {
	if (res.locals.account) {
		// need to check for account verification for verify page as well
		return dynamicResponse(req, res, 302, { redirect: '/welcome' });
	}
	next();
}
