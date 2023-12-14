'use strict';

import { ObjectId } from 'mongodb';

export type Datasource = {
    _id?: ObjectId;
    orgId?: ObjectId;
    teamId?: ObjectId;
    name: string;
    sourceType: string; //airbyte
    sourceId: string; //airbyte
    destinationId: string; //airbyte
    connectionId: string; //airbyte
    workspaceId: string; //airbyte
};
