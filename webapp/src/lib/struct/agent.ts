'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/icon';

export type CodeExecutionConfigType = {
	lastNMessages: number;
	workDirectory: string;
};

export type Agent = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	role: string;
	goal: string;
	backstory: string;
	modelId: ObjectId;
	functionModelId: ObjectId;
	maxIter: number;
	maxRPM: number;
	verbose: boolean;
	allowDelegation: boolean;
	toolIds?: ObjectId[];
	icon?: IconAttachment;
	// stepCallback: Function;
};
