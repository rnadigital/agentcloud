'use strict';

import { ObjectId } from 'mongodb';

export type Notification = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	targetId: ObjectId;
	targetCollection: string;
	title: string;
	description: string;
	date: Date;
	seen: boolean;
};
