'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export type CodeExecutionConfigType = {
	lastNMessages: number;
	workDirectory: string;
};
export type Agent = {
	_id?: ObjectId | string;
	orgId?: ObjectId | string;
	teamId?: ObjectId | string;
	name: string;
	role: string;
	goal: string;
	backstory: string;
	modelId: ObjectId | string;
	functionModelId: ObjectId | string | null;
	maxIter: number | null;
	maxRPM: number | null;
	verbose: boolean;
	allowDelegation: boolean;
	toolIds?: (ObjectId | string)[];
	icon?:
		| IconAttachment
		| {
				id: string;
				filename: string;
				linkedId?: ObjectId;
		  };
	hidden?: boolean;
	group?: any[];
	variableIds?: (ObjectId | string)[];
	dateCreated?: Date;
};

// export type Agent = {
// 	_id?: ObjectId;
// 	orgId?: ObjectId;
// 	teamId?: ObjectId;
// 	name: string;
// 	role: string;
// 	goal: string;
// 	backstory: string;
// 	modelId: ObjectId;
// 	functionModelId: ObjectId;
// 	maxIter: number;
// 	maxRPM: number;
// 	verbose: boolean;
// 	allowDelegation: boolean;
// 	toolIds?: ObjectId[];
// 	icon?: IconAttachment;
// 	// stepCallback: Function;
// 	hidden?: boolean;
// };

// export interface Agent1 {
// 	_id: string;
// 	orgId: string;
// 	teamId: string;
// 	name: string;
// 	role: string;
// 	goal: string;
// 	backstory: string;
// 	modelId: string;
// 	functionModelId: string | null;
// 	maxIter: number | null;
// 	maxRPM: number | null;
// 	verbose: boolean;
// 	allowDelegation: boolean;
// 	toolIds: string[];
// 	icon: {
// 		id: string;
// 		filename: string;
// 	};
// 	group: any[];
// }
