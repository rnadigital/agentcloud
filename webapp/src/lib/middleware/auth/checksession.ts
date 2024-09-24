'use strict';

import { dynamicResponse } from '@dr';

export default function checkSession(req, res, next) {
	if (!res.locals.account?._id && !res.locals.isAgentBackend) {
		if (res.locals.isSocket) {
			return res?.locals?.socket?.disconnect();
		} else {
			return dynamicResponse(req, res, 302, {
				redirect: `/login?goto=${encodeURIComponent(req.originalUrl)}`
			});
		}
	}
	next();
}
