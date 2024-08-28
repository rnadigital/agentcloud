'use strict';

import { ObjectId } from 'mongodb';

//RMDVLP: this seems depreciated? do a file check on it to see
export type Group = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	adminAgent: ObjectId;
	agents: ObjectId[];
	groupChat?: boolean;
};

//RMDVLP: can enum this using jsdoc
export enum ProcessImpl {
	SEQUENTIAL = 'sequential',
	HIERARCHICAL = 'hierarchical'
}

/**
 * @openapi
 * 
 */
export type Crew = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	tasks: ObjectId[];
	agents: ObjectId[];
	process: ProcessImpl;
	managerModelId?: ObjectId;
	hidden?: boolean;
	verbose?: number;
	fullOutput?: boolean;
};
