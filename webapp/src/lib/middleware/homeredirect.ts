'use strict';

export default function homeRedirect(_req, res, _next) {
	const homeRedirect = res.locals.account ? `/${res.locals.account.currentTeam}/apps` : '/register';
	res.redirect(homeRedirect);
}
