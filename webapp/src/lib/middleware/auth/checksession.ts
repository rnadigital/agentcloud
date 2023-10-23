'use strict';

import { dynamicResponse } from '../../../util';

export default function checkSession(req, res, next) {
	if (!res.locals.account) {
		return dynamicResponse(req, res, 302, { redirect: '/login' });
	}
	next();
}
