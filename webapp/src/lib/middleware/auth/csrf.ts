'use strict';

import csrf from 'csurf';

const csrfCheck = csrf();

export default function csrfMiddleware(req, res, next) {
	if (
		req.method === 'GET' || //GETs should always run the middleware because it attaches req.csrfToken() for later.
		res.locals.checkCsrf === true
	) {
		return csrfCheck(req, res, next);
	}

	next();
}
