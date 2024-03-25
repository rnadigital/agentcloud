'use strict';

import { dynamicResponse } from '@dr';
import { getNotificationsByTeam, markNotificationsSeen } from 'db/notification';
import toObjectId from 'misc/toobjectid';

export async function notificationsData(req, res, _next) {
	const notifications = await getNotificationsByTeam(req.params.resourceSlug);
	// const notifications = await getAllNotificationsByTeam(req.params.resourceSlug);
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

export async function markNotificationsSeenApi(req, res, next) {

	const { notificationIds } = req.body;

	const notificationMongoIds = notificationIds && notificationIds
		.filter(ni => typeof ni === 'string')
		.map(ni => toObjectId(ni));
	if (!notificationIds) {
		return dynamicResponse(req, res, 200, { }); //error or?
	}

	await markNotificationsSeen(req.params.resourceSlug, notificationMongoIds);
	
	return dynamicResponse(req, res, 200, { });

}
