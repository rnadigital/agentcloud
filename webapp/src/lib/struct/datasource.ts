'use strict';

import { ObjectId } from 'mongodb';

export type DatasourceStream = {
	syncMode: string; //TODO: enum to match airbyte api
	name: string;
};

export enum DatasourceScheduleType {
	CRON = 'cron',
	MANUAL = 'manual'
}

export type DatasourceConnectionSettings = {
	prefix: string | null;
	name: string;
	sourceId: string;
	destinationId: string;
	status: string; //TODO: enum to match airbyte api, and allow creating in paused state
	configurations: any; //TODO
	schedule?: {
		scheduleType: DatasourceScheduleType;
		cronExpression?: string;
	};
	dataResidency?: string;
	namespaceDefinition?: string;
	namespaceFormat?: string | null;
	nonBreakingSchemaUpdatesBehavior: string;
};

export enum DatasourceStatus {
	DRAFT = 'draft', //connection test
	PROCESSING = 'processing', //airybte -> vector db proxy for non file type only
	EMBEDDING = 'embedding', //vector db proxy -> qdrant
	READY = 'ready' //synced/embedded
}

export const datasourceStatusColors = {
	[DatasourceStatus.DRAFT]: 'bg-yellow-500',
	[DatasourceStatus.PROCESSING]: 'bg-blue-300',
	[DatasourceStatus.EMBEDDING]: 'bg-yellow-500',
	[DatasourceStatus.READY]: 'bg-green-500'
};

export type DatasourceRecordCount = {
	total?: number;
	success?: number;
	failure?: number;
};

export type UnstructuredChunkingStrategy = 'basic' | 'by_title' | 'by_page' | 'by_similarity';

export type UnstructuredChunkingConfig = {
	strategy: UnstructuredChunkingStrategy;
	max_characters: number;
	new_after_n_chars: number;
	overlap: number;
	similarity_threshold: number; // between 0.0 and 1.0
	overlap_all: boolean;
};

export type Datasource = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	description?: string;
	originalName: string;
	filename?: string;
	sourceType: string;
	sourceId: string;
	destinationId: string;
	workspaceId: string;
	connectionId: string;
	recordCount?: DatasourceRecordCount;
	connectionSettings?: DatasourceConnectionSettings;
	createdDate: Date;
	lastSyncedDate?: Date | null; //Note: null = never synced
	status?: DatasourceStatus;
	discoveredSchema?: any;
	chunkingConfig?: UnstructuredChunkingConfig;
	embeddingField?: string;
	timeWeightField?: string;
	modelId?: ObjectId; //model id of embedding model in models collection
	hidden?: boolean;
	descriptionsMap?: Record<string, string>;
	timeUnit?: string; //temp until we have a more robust way to limit cron frequency based on plan
};
