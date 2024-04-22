'use strict';

import { ObjectId } from 'mongodb';

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
};

export enum CollectionName {
	Accounts = 'accounts',
	Agents = 'agents',
	Apps = 'apps',
	Chat = 'chat',
	CheckoutSessions = 'checkoutsessions',
	Credentials = 'credentials',
	Crews = 'crews',
	Datasources = 'datasources',
	Version = 'version',
	Models = 'models',
	Notifications = 'notifications',
	Orgs = 'orgs',
	PaymentLinks = 'paymentlinks',
	PortalLinks = 'portallinks',
	Sessions = 'sessions',
	Tasks = 'tasks',
	Teams = 'teams',
	Tools = 'tools',
	Verifications = 'verifications'
}
