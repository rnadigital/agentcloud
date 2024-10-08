'use strict';

import { dynamicResponse } from '@dr';

export default function checkSessionWelcome(req, res, next) {
	if (res.locals.account) {
		// need to check for account verification for verify page as well
		// console.log('checkSessionWelcome: ', res.locals.account);
		return dynamicResponse(req, res, 302, { redirect: '/welcome' });
	}
	next();
}
