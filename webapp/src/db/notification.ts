'use strict';

import * as db from 'db/index';
import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';
import { Notification } from 'struct/notification';

const log = debug('webapp:db:notifications');

export function NotificationsCollection(): any {
	return db.db().collection('notifications');
}

// Get a single notification by its ID and teamId
export function getNotificationById(
	teamId: db.IdOrStr,
	notificationId: db.IdOrStr
): Promise<Notification> {
	return NotificationsCollection().findOne({
		_id: toObjectId(notificationId),
		teamId: toObjectId(teamId)
	});
}

// Get all notifications for a specific team
export function getAllNotificationsByTeam(teamId: db.IdOrStr): Promise<Notification[]> {
	return NotificationsCollection()
		.find({
			teamId: toObjectId(teamId)
		})
		.sort({
			_id: -1
		})
		.toArray();
}

// Get all notifications for a specific team
export function getNotificationsByTeam(teamId: db.IdOrStr): Promise<Notification[]> {
	return NotificationsCollection()
		.find({
			teamId: toObjectId(teamId),
			seen: false
		})
		.sort({
			_id: -1
		})
		.toArray();
}

// Get all notifications for multiple teams
export function getNotificationsByTeams(teamIds: db.IdOrStr[]): Promise<Notification[]> {
	return NotificationsCollection()
		.find({
			teamId: {
				$in: teamIds
			}
		})
		.sort({
			_id: -1
		})
		.toArray();
}

// Add a new notification for a specific team
export async function addNotification(notification: Notification): Promise<InsertResult> {
	// Assuming the notification object already contains a teamId property
	return NotificationsCollection().insertOne(notification);
}

// Mark a specific notification as seen by its ID and teamId
export async function markNotificationsSeen(
	teamId: db.IdOrStr,
	notificationIds: db.IdOrStr[]
): Promise<any> {
	return NotificationsCollection().updateMany(
		{ _id: { $in: notificationIds }, teamId: toObjectId(teamId) },
		{ $set: { seen: true } }
	);
}

// Delete a specific notification by its ID and teamId
export async function deleteNotification(
	teamId: db.IdOrStr,
	notificationId: db.IdOrStr
): Promise<any> {
	return NotificationsCollection().deleteOne({
		_id: toObjectId(notificationId),
		teamId: toObjectId(teamId)
	});
}
