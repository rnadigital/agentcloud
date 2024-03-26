import { ObjectId } from 'mongodb';

export type Icon = {
	_id?: ObjectId;
	teamId: ObjectId;
	orgId: ObjectId;
	filename: string;
	mimeType: string;
	uploadedAt: Date;
}

export type IconAttachment = {
	id: ObjectId;
	filename: string;	
}
