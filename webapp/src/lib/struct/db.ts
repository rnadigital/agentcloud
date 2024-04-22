import { ObjectId } from 'mongodb';

export type InsertResult = {
	acknowledged?: boolean;
	insertedId?: ObjectId;
}

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
