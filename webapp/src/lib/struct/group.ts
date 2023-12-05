'use strict';

import { ObjectId } from 'mongodb';

export type Group = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	adminAgent: ObjectId;
	agents: ObjectId[];
	groupChat?: boolean;
};
