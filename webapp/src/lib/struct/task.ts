'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export type Task = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	description: string;
	agentId?: ObjectId;
	expectedOutput?: string;
	toolIds?: ObjectId[];
	asyncExecution?: boolean;
	context?: ObjectId[];
	outputJson?: any;
	outputPydantic?: any;
	outputFile?: string;
	// callback: any;
	icon?: IconAttachment;
	requiresHumanInput?: boolean;
	hidden?: boolean;
};
