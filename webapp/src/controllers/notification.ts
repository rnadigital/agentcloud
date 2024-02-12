'use strict';

import { getNotificationsByTeam } from 'db/notification';

export async function notificationsData(req, res, _next) {
	const notifications = await getNotificationsByTeam(req.params.resourceSlug);
	return {
		csrf: req.csrfToken(),
		notifications,
	};
}

/**
 * GET /notifications.json
 * team tools json data
 */
export async function notificationsJson(req, res, next) {
	const data = await notificationsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

