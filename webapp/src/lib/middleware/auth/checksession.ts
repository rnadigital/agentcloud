'use strict';

import { dynamicResponse } from '@dr';

export default function checkSession(req, res, next, socket?) {
	if (!res.locals.account && !res.locals.isAgentBackend) {
		if (res.locals.isSocket) {
			return socket.disconnect();
		} else {
			return dynamicResponse(req, res, 302, { redirect: '/login' });
		}
	}
	next();
}
