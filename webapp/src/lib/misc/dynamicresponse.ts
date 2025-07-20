import url from 'node:url';

import { createLogger } from 'utils/logger';

const log = createLogger('webapp:dynamicresponse');

export function dynamicResponse(req, res, code, data) {
	if (typeof res?.status !== 'function') {
		return log.info('res.status is not a function, returning from mock call');
	}
	const isRedirect = code === 302;
	if (
		req.headers &&
		(req.headers['content-type'] === 'application/json' ||
			req.headers['content-type']?.startsWith('multipart/form-data'))
	) {
		return res.status(isRedirect ? 200 : code).json(data);
	}
	if (isRedirect) {
		return res.redirect(data.redirect);
	}
	//TODO: pass through app (bind to middleware) and app.render an "error" page for nojs users?
	return res.status(code).send(data);
}
