import { ObjectId } from 'mongodb';

export type Log = {
	orgId?: ObjectId | string;
	teamId?: ObjectId | string;
	userId: ObjectId | string;
	objectIds?: ObjectId[] | string[];
	startTime: Date;
	functionName: string;
	arguments: any;
};
