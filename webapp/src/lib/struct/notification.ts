'use strict';

import { ObjectId } from 'mongodb';
import { CollectionName } from 'struct/db';

export enum NotificationType {
    Webhook = 'Webhook',
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
    EmbeddingCompleted = 'EmbeddingCompleted',
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
export type NotificationDetails = WebhookDetails | SystemUpdateDetails | UserActionDetails | ProcessingErrorDetails;

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
