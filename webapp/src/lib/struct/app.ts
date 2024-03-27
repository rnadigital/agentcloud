'use strict';

import { ObjectId } from 'mongodb';

export type App = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	description?: string;
	author?: string;
	tags?: string[];
	visibility?: any; //TODO: perms
	capabilities?: string;
	crewId?: ObjectId;
	appType: AppType;
};

export enum AppType {
	CHAT = 'chat',
	PROCESS = 'process',
}
