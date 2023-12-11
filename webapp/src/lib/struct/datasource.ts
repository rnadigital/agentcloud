'use strict';

import { ObjectId } from 'mongodb';

export type Datasource = {
    _id?: ObjectId;
    orgId?: ObjectId;
    teamId?: ObjectId;
    name: string; //airbyte
    sourceId: string; //airbyte
    sourceType: string; //airbyte
    workspaceId: string; //airbyte
};
