'use strict';

import { ObjectId } from 'mongodb';

type Stream = {
    syncMode: string; //TODO: enum to match airbyte api
    name: string;
};

export type Datasource = {
    _id?: ObjectId;
    orgId?: ObjectId;
    teamId?: ObjectId;
    name: string;
    originalName: string;
    gcsFilename: string;
    sourceType: string; //airbyte
    sourceId: string; //airbyte
    destinationId: string; //airbyte
    workspaceId: string; //airbyte
    connectionId: string; //airbyte
    connectionSettings?: {
        configurations: {
            streams: Stream[]
        },
        schedule: {
            scheduleType: string; //TODO: allow scheduling
        },
        dataResidency: string;
        namespaceDefinition: string;
        namespaceFormat: string | null;
        nonBreakingSchemaUpdatesBehavior: string;
        name: string;
        sourceId: string;
        destinationId: string;
        status: string; //TODO: enum to match airbyte api, and allow creating in paused state
    }
};
