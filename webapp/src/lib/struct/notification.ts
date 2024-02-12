'use strict';

import { ObjectId } from 'mongodb';

export type Notification = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	target: {
		id: string;
		collection: string;
		property: string;
		objectId: boolean;
	};
	title: string;
	description: string;
	date: Date;
	seen: boolean;
};
