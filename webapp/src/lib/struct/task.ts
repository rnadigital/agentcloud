'use strict';

import { ObjectId } from 'mongodb';

export type Task = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	description: string;
	expectedOutput: string;
	toolIds: ObjectId[];
	asyncExecution: boolean;
	context: string;
	outputJson: any;
	outputPydantic: any;
	outputFile: string;
	// callback: any;
};
