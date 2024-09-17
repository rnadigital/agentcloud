import { ObjectId } from 'mongodb';
import { CollectionName } from 'struct/db';

export type Asset = {
	_id?: ObjectId;
	teamId: ObjectId;
	orgId: ObjectId;
	filename: string;
	originalFilename: string;
	mimeType: string;
	uploadedAt: Date;
	linkedToId?: ObjectId;
	linkedCollection?: CollectionName;
};

export type IconAttachment = {
	id: ObjectId;
	linkedId?: ObjectId;
	filename: string;
};
