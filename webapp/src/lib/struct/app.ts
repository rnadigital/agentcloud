'use strict';

import { ObjectId } from 'mongodb';

export type App = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	//TODO: 
};
