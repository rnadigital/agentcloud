'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export type App = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	memory?: boolean;
	cache?: boolean;
	description?: string;
	author?: string;
	tags?: string[];
	visibility?: any; //TODO: perms
	crewId?: ObjectId;
	icon: IconAttachment;
};
