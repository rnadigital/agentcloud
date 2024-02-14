'use strict';

import { ObjectId } from 'mongodb';

export type DatasourceStream = {
	syncMode: string; //TODO: enum to match airbyte api
	name: string;
};

export type DatasourceConnectionSettings = {
	syncCatalog: any; //TODO
	scheduleType: string; //TODO: allow scheduling
	namespaceDefinition?: string;
	namespaceFormat?: string | null;
	nonBreakingSchemaUpdatesBehavior: string;
	prefix: string | null;
	name: string;
	sourceId: string;
	destinationId: string;
	status: string; //TODO: enum to match airbyte api, and allow creating in paused state
};

export type DatasourceChunkStrategy = 'semantic' | 'character';

export enum DatasourceStatus {
	DRAFT = 'draft', //connection test
	PROCESSING = 'processing', //airybte -> vector db proxy for non file type only
	EMBEDDING = 'embedding', //vector db proxy -> qdrant
	READY = 'ready', //synced/embedded
}

export const datasourceStatusColors = {
	[DatasourceStatus.DRAFT]: 'bg-yellow-500',
	[DatasourceStatus.PROCESSING]: 'bg-orange-500',
	[DatasourceStatus.EMBEDDING]: 'bg-orange-500',
	[DatasourceStatus.READY]: 'bg-green-500',
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
	createdDate: Date;
	lastSyncedDate?: Date | null; //Note: null = never synced
	status?: DatasourceStatus;
	discoveredSchema?: any;
	chunkStrategy?: DatasourceChunkStrategy;
	chunkCharacter?: string | null;
	embeddingField?: string | null;
	modelId?: ObjectId; //model id of embedding model in models collection
};
