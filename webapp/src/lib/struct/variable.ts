'use strict';

import { ObjectId } from 'mongodb';

export interface Variable {
	_id?: ObjectId | string;
	orgId?: ObjectId | string;
	teamId?: ObjectId | string;
	name: string;
	defaultValue: string;
	type: 'string' | 'number' | 'boolean';
	createdBy?: ObjectId | string;
	createDate?: Date;
	usedIn?: (ObjectId | string)[];
}
