'use strict';

import { ObjectId } from 'mongodb';

export type Group = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	adminAgent: ObjectId;
	agents: ObjectId[];
	groupChat?: boolean;
};

export enum ProcessImpl {
	SEQUENTIAL = 'sequential',
	HEIRARCHICAL = 'heirarchical',
}

export type Crew = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	tasks: ObjectId[];
	agents: ObjectId[];
	process: ProcessImpl;
};	
