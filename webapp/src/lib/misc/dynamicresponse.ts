import url from 'node:url';

export function dynamicResponse(req, res, code, data) {
	const isRedirect = code === 302;
	if (req.headers && (req.headers['content-type'] === 'application/json'
		|| req.headers['content-type']?.startsWith('multipart/form-data'))) {
		return res
			.status(isRedirect ? 200 : code)
			.json(data);
	}
	if (isRedirect) {
		return res.redirect(data.redirect);
	}
	//TODO: pass through app (bind to middleware) and app.render an "error" page for nojs users?
	return res.status(code).send(data);
}
