'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export enum AppType {
	CHAT = 'chat',
	CREW = 'crew',
}

export type App = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	description?: string;
	type: AppType;
	author?: string;
	tags?: string[];
	visibility?: any; //TODO: perms
	icon: IconAttachment;
	hidden?: boolean;
	//AppType.CREW
	crewId?: ObjectId;
	memory?: boolean;
	cache?: boolean;
	//AppType.CHAT
	agentId?: ObjectId;
	conversationStarters?: string;
	toolIds?: ObjectId[];
	datasourceId?: ObjectId;
};
