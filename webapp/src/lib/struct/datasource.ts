'use strict';

import { ObjectId } from 'mongodb';

export type DatasourceStream = {
    syncMode: string; //TODO: enum to match airbyte api
    name: string;
};

export type DatasourceConnectionSettings = {
    configurations: {
        streams: DatasourceStream[]
    },
    schedule: {
        scheduleType: string; //TODO: allow scheduling
    },
    dataResidency: string;
    namespaceDefinition: string;
    namespaceFormat: string | null;
    nonBreakingSchemaUpdatesBehavior: string;
    prefix: string | null;
    name: string;
    sourceId: string;
    destinationId: string;
    status: string; //TODO: enum to match airbyte api, and allow creating in paused state
};

export type Datasource = {
    _id?: ObjectId;
    orgId?: ObjectId;
    teamId?: ObjectId;
    name: string;
    originalName: string;
    gcsFilename: string;
    sourceType: string;
    sourceId: string;
    destinationId: string;
    workspaceId: string;
    connectionId: string;
    connectionSettings?: DatasourceConnectionSettings;
    lastSyncedDate?: Date | null; //Note: null = never synced
};
