'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export type App = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	memory?: boolean;
	description?: string;
	author?: string;
	tags?: string[];
	visibility?: any; //TODO: perms
	capabilities?: string;
	crewId?: ObjectId;
	appType: AppType;
	icon: IconAttachment;
};

export enum AppType {
	CHAT = 'chat',
	PROCESS = 'process',
}
