'use strict';

import { ObjectId } from 'mongodb';
import { CollectionName } from 'struct/db';

export enum NotificationType {
	Webhook = 'Webhook', // Webhooks from airbyte/vector-db-proxy callbacks
	Tool = 'Tool', // Function tool deployment updates
	// Not used yet
	SystemUpdate = 'SystemUpdate',
	UserAction = 'UserAction',
	ProcessingError = 'ProcessingError'
}

export enum WebhookType {
	FailedSync = 'FailedSync',
	SuccessfulSync = 'SuccessfulSync',
	AutomaticConnectionUpdate = 'AutomaticConnectionUpdate',
	ConnectionUpdatesRequiringAction = 'ConnectionUpdatesRequiringAction',
	WarningRepeatedFailures = 'WarningRepeatedFailures',
	SyncDisabledRepeatedFailures = 'SyncDisabledRepeatedFailures',
	EmbeddingCompleted = 'EmbeddingCompleted'
}

export type WebhookDetails = {
	webhookType: WebhookType;
};

//Note: these 3 unused atm
export type SystemUpdateDetails = {
	updateDescription: string;
};

export type UserActionDetails = {
	userId: ObjectId;
	actionPerformed: string;
};

export type ProcessingErrorDetails = {
	errorCode: string;
	errorMessage: string;
};

// Union type for various notification details
export type NotificationDetails =
	| WebhookDetails
	| SystemUpdateDetails
	| UserActionDetails
	| ProcessingErrorDetails;

export type Notification = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	target: {
		id: string;
		collection: CollectionName;
		property: string;
		objectId: boolean;
	};
	title: string;
	description: string;
	date: Date;
	seen: boolean;
	type?: NotificationType;
	details?: NotificationDetails; // Optional detailed context for the notification
};

/**
 * @openapi
 *  components:
 *   schemas:
 *    NotificationType:
 *     type: string
 *     description: Enum representing the different types of notifications.
 *     enum:
 *      - Webhook
 *      - Tool
 *      - SystemUpdate
 *      - UserAction
 *      - ProcessingError
 *
 *    WebhookType:
 *     type: string
 *     description: Enum representing the different types of webhooks.
 *     enum:
 *      - FailedSync
 *      - SuccessfulSync
 *      - AutomaticConnectionUpdate
 *      - ConnectionUpdatesRequiringAction
 *      - WarningRepeatedFailures
 *      - SyncDisabledRepeatedFailures
 *      - EmbeddingCompleted
 *
 *    WebhookDetails:
 *     type: object
 *     description: Details specific to webhook notifications.
 *     required:
 *      - webhookType
 *     properties:
 *      webhookType:
 *       description: The type of webhook.
 *       $ref: '#/components/schemas/WebhookType'
 *
 *    SystemUpdateDetails:
 *     type: object
 *     description: Details specific to system update notifications.
 *     required:
 *      - updateDescription
 *     properties:
 *      updateDescription:
 *       description: A description of the system update.
 *       type: string
 *
 *    UserActionDetails:
 *     type: object
 *     description: Details specific to user action notifications.
 *     required:
 *      - userId
 *      - actionPerformed
 *     properties:
 *      userId:
 *       description: The ID of the user who performed the action.
 *       $ref: '#/components/schemas/ObjectId'
 *      actionPerformed:
 *       description: A description of the action performed by the user.
 *       type: string
 *
 *    ProcessingErrorDetails:
 *     type: object
 *     description: Details specific to processing error notifications.
 *     required:
 *      - errorCode
 *      - errorMessage
 *     properties:
 *      errorCode:
 *       description: The error code associated with the processing error.
 *       type: string
 *      errorMessage:
 *       description: A description of the processing error.
 *       type: string
 *
 *    NotificationDetails:
 *     type: object
 *     description: Union type for various notification details, including webhook, system update, user action, and processing error details.
 *     oneOf:
 *      - $ref: '#/components/schemas/WebhookDetails'
 *      - $ref: '#/components/schemas/SystemUpdateDetails'
 *      - $ref: '#/components/schemas/UserActionDetails'
 *      - $ref: '#/components/schemas/ProcessingErrorDetails'
 *
 *    Notification:
 *     type: object
 *     description: Represents a notification in the system, including details about the notification type, target, and additional context.
 *     required:
 *      - target
 *      - title
 *      - description
 *      - date
 *      - seen
 *     properties:
 *      _id:
 *       description: Unique identifier for the notification.
 *       $ref: '#/components/schemas/ObjectId'
 *      orgId:
 *       description: Identifier of the organization to which the notification belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      teamId:
 *       description: Identifier of the team to which the notification belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      target:
 *       type: object
 *       description: Information about the target of the notification.
 *       required:
 *        - id
 *        - collection
 *        - property
 *        - objectId
 *       properties:
 *        id:
 *         description: The ID of the target object.
 *         type: string
 *        collection:
 *         description: The collection name where the target object resides.
 *         type: string
 *        property:
 *         description: The specific property within the target object.
 *         type: string
 *        objectId:
 *         description: Indicates whether the target ID is an ObjectId.
 *         type: boolean
 *      title:
 *       description: The title of the notification.
 *       type: string
 *      description:
 *       description: A brief description of the notification.
 *       type: string
 *      date:
 *       description: The date and time when the notification was created.
 *       type: string
 *       format: date-time
 *      seen:
 *       description: Indicates whether the notification has been seen.
 *       type: boolean
 *      type:
 *       description: The type of the notification.
 *       $ref: '#/components/schemas/NotificationType'
 *      details:
 *       description: Additional detailed context for the notification, depending on the notification type.
 *       $ref: '#/components/schemas/NotificationDetails'
 */
