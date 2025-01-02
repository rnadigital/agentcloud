'use strict';

import { ObjectId } from 'mongodb';

export interface Variable {
	_id?: ObjectId | string;
	orgId?: ObjectId | string;
	teamId?: ObjectId | string;
	name: string;
	defaultValue: string;
	createdBy?: ObjectId | string;
	createDate?: Date;
	usedInTasks?: (ObjectId | string)[];
	usedInAgents?: (ObjectId | string)[];
	description?: string;
}
