'use strict';

import { ObjectId } from 'mongodb';

export type ToolRevision = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	toolId: ObjectId;
	content: any;
	date: Date;
};
