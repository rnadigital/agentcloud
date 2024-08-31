'use strict';
import { Binary, ObjectId } from 'mongodb';

export type APIKey = {
	_id?: ObjectId;
	version?: number;
	name: string;
	description?: string;
	expirationDate: Date | null;
	ownerId: ObjectId;
	token?: string;
	permissions?: Binary; //TODO: set up permissions with API keys
};
