'use strict';

const cache: Record<string, any> = {};

export default function renderStaticPage(app, pagePath: string) {
	return (
		cache[pagePath] ||
		(cache[pagePath] = (req, res, _next) => {
			app.render(req, res, pagePath);
		})
	);
}
