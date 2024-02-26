'use strict';

import { ObjectId } from 'mongodb';

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
	datasourceIds?: ObjectId[];
	// stepCallback: Function;
};
