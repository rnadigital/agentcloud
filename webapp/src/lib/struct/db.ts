import { ObjectId } from 'mongodb';

export type InsertResult = {
	acknowledged?: boolean;
	insertedId?: ObjectId;
};

export enum CollectionName {
	Accounts = 'accounts',
	Agents = 'agents',
	Apps = 'apps',
	Chat = 'chat',
	CheckoutSessions = 'checkoutsessions',
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
	Toolrevisions = 'toolrevisions',
	Verifications = 'verifications',
	ShareLinks = 'sharelinks'
}

/**
 * @openapi
 *  components:
 *   schemas:
 *    InsertResult:
 *     type: object
 *     description: Represents the result of an insert operation in the database, including whether the operation was acknowledged and the ID of the inserted document.
 *     properties:
 *      acknowledged:
 *       description: Indicates whether the insert operation was acknowledged by the database.
 *       type: boolean
 *      insertedId:
 *       description: The unique identifier of the inserted document.
 *       $ref: '#/components/schemas/ObjectId'
 */
