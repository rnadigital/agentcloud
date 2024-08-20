'use strict';
import { Binary, ObjectId } from 'mongodb';

export type APIKey = {
	_id?: ObjectId | string;
	version?: number;
	name: string;
	description?: string;
	expirationDate: Date;
	ownerId: ObjectId | string;
	permissions?: Binary; //TODO: set up permissions with API keys
};
