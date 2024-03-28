import { ObjectId } from 'mongodb';

export type Asset = {
	_id?: ObjectId;
	teamId: ObjectId;
	orgId: ObjectId;
	filename: string;
	originalFilename: string;
	mimeType: string;
	uploadedAt: Date;
}

export type IconAttachment = {
	id: ObjectId;
	filename: string;	
}
