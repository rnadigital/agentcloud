'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';
import { SharingConfig } from 'struct/sharing';

export enum AppType {
	CHAT = 'chat',
	CREW = 'crew'
}

export type ChatAppConfig = {
	agentId: ObjectId;
	conversationStarters: string[];
	maxMessages?: number;
};

export type VariableConfig = {
	id: ObjectId;
	name: string;
	defaultValue: string;
};

export type App = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	name: string;
	description: string;
	type: AppType;
	author: string;
	tags: string[];
	icon: IconAttachment;
	hidden?: boolean;
	sharingConfig: SharingConfig;
	chatAppConfig?: ChatAppConfig;
	//TODO: create a "CrewAppConfig" for these:
	memory?: boolean;
	cache?: boolean;
	crewId?: ObjectId;
	shareLinkShareId?: string;
	variables?: VariableConfig[];
	createdBy: ObjectId;
	kickOffVariablesIds?: ObjectId[];
};
