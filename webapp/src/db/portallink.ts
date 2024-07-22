'use strict';

import * as db from 'db/index';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';

import toObjectId from '../lib/misc/toobjectid';

export type PortalLink = {
	_id?: ObjectId;
	accountId?: ObjectId;
	portalLinkId: string;
	url: string;
	createdDate: Date;
	payload: any;
};

export function PortalLinkCollection(): any {
	return db.db().collection('portallinks');
}

export function getPortalLinkById(
	accountId: db.IdOrStr,
	portalLinkId: string
): Promise<PortalLink> {
	return PortalLinkCollection().findOne({
		portalLinkId: portalLinkId,
		accountId: toObjectId(accountId)
	});
}

export function unsafeGetPortalLinkById(portalLinkId: string): Promise<PortalLink> {
	return PortalLinkCollection().findOne({
		portalLinkId: portalLinkId
	});
}

export async function addPortalLink(portalLink: PortalLink): Promise<InsertResult> {
	return PortalLinkCollection().insertOne(portalLink);
}

export function deletePortalLinkById(accountId: db.IdOrStr, portalLinkId: string): Promise<any> {
	return PortalLinkCollection().deleteOne({
		portalLinkId: portalLinkId,
		accountId: toObjectId(accountId)
	});
}
