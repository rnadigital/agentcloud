import { ObjectId } from 'mongodb';

export enum ShareLinkTypes {
	APP = 'app'
}

export type ShareLinkType = ShareLinkTypes;

export type ShareLink = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	shareId: string; // actual id that goes in the link
	type: ShareLinkType;
	createdDate: Date;
	payload: {
		id: ObjectId; // i.e the app _id since we only suppor apps for now
	};
};
