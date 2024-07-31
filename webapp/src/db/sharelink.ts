'use strict';

import { randomBytes } from 'crypto';
import * as db from 'db/index';
import toObjectId from 'lib/misc/toobjectid';
import { CollectionName } from 'struct/db';
import { ShareLink } from 'struct/sharelink';

export function ShareLinksCollection(): any {
	return db.db().collection(CollectionName.ShareLinks);
}

export async function getShareLinkByShareId(
	teamId: db.IdOrStr,
	shareId: string
): Promise<ShareLink> {
	return ShareLinksCollection().findOne({
		teamId: toObjectId(teamId),
		shareId
	});
}

export async function createShareLink(shareLink: Partial<ShareLink>): Promise<string> {
	const randomBytesHex: string = await randomBytes(32).toString('hex');
	const shareLinkShareId = `${shareLink.type}_${randomBytesHex}`; //prefixed for readability not for any functional reason (yet)
	await ShareLinksCollection().insertOne({
		...shareLink,
		shareId: shareLinkShareId,
		createdDate: new Date()
	});
	return shareLinkShareId;
}

export async function updateShareLinkPayload({
	teamId,
	shareId,
	payload
}: {
	teamId: db.IdOrStr;
	shareId: string;
	payload: any;
}): Promise<any> {
	return ShareLinksCollection().updateOne(
		{
			teamId: toObjectId(teamId),
			shareId
		},
		{
			$set: {
				payload
			}
		}
	);
}
