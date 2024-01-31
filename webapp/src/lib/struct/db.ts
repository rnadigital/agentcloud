import { ObjectId } from 'mongodb';

export type InsertResult = {
	acknowledged?: boolean;
	insertedId?: ObjectId;
}
