'use strict';

import { InferSchemaType, model, models, Schema, Types } from 'mongoose';

import { Cloud, Region } from './vectorproxy';
const MongooseObjectId = Types.ObjectId;

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
	READY = 'ready', //synced/embedded
	ERROR = 'error' //rrror, currently used when the sync would exceed the remaining limit
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

export const SyncModes = [
	// 'full_refresh_overwrite',
	'full_refresh_append',
	'incremental_append'
	// 'incremental_deduped_history'
];
export type SyncMode = (typeof SyncModes)[number];

export type FieldDescription = {
	description: string;
	type: string;
};

export type StreamConfig = {
	checkedChildren: string[];
	primaryKey: string[];
	syncMode: SyncMode;
	cursorField: string[];
	descriptionsMap: FieldDescriptionMap;
};

export type StreamConfigMap = {
	[key: string]: StreamConfig;
};

export type FieldDescriptionMap = {
	[key: string]: FieldDescription;
};

export function getMetadataFieldInfo(config: StreamConfigMap = {}) {
	return Object.keys(config).reduce((acc, topKey) => {
		const descriptionsMap = config[topKey].descriptionsMap;
		const items = Object.keys(descriptionsMap).reduce((innerAcc, key) => {
			const { description, type } = descriptionsMap[key];
			innerAcc.push({
				name: key,
				description: description || '',
				type: type || ''
			});
			return innerAcc;
		}, []);
		acc = acc.concat(items);
		return acc;
	}, []);
}

export const UnstructuredChunkingStrategyValues = [
	'basic',
	'by_title',
	'by_page',
	'by_similarity'
] as const;
export const UnstructuredPartitioningStrategyValues = [
	'auto',
	'fast',
	'hi_res',
	'ocr_only'
] as const;
export type UnstructuredChunkingStrategy = (typeof UnstructuredChunkingStrategyValues)[number];
export type UnstructuredPartitioningStrategy =
	(typeof UnstructuredPartitioningStrategyValues)[number];
export const UnstructuredChunkingStrategySet = new Set(UnstructuredChunkingStrategyValues);
export const UnstructuredPartitioningStrategySet = new Set(UnstructuredPartitioningStrategyValues);

export type UnstructuredChunkingConfig = {
	partitioning: UnstructuredPartitioningStrategy;
	strategy: UnstructuredChunkingStrategy;
	max_characters: number;
	new_after_n_chars: number;
	overlap: number;
	similarity_threshold: number; // between 0.0 and 1.0
	overlap_all: boolean;
	file_type?: 'txt' | 'markdown'; //Note: only used for connectors
};

export interface Datasource {
	_id: Types.ObjectId;
	orgId?: Types.ObjectId;
	teamId?: Types.ObjectId;
	vectorDbId?: Types.ObjectId;
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
	modelId?: Types.ObjectId; //model id of embedding model in models collection
	streamConfig?: StreamConfigMap;
	timeUnit?: string; //temp until we have a more robust way to limit cron frequency based on plan
	collectionName?: string;
	namespace?: string;
	byoVectorDb?: boolean;
	region?: Region;
	cloud?: Cloud;
	vectordbtype?: string;
}

const datasourceSchema = new Schema<Datasource>(
	{
		orgId: { type: Schema.Types.ObjectId, ref: 'Org' },
		teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
		vectorDbId: { type: Schema.Types.ObjectId, ref: 'VectorDb' },
		name: { type: String, required: true },
		description: String,
		originalName: { type: String, required: true },
		filename: String,
		sourceType: { type: String, required: true },
		sourceId: { type: String, required: true },
		destinationId: { type: String, required: true },
		workspaceId: { type: String, required: true },
		connectionId: { type: String, required: true },
		recordCount: Object,
		connectionSettings: Object,
		createdDate: { type: Date, default: Date.now },
		lastSyncedDate: { type: Date, default: null },
		status: String,
		discoveredSchema: Object,
		chunkingConfig: Object,
		embeddingField: String,
		timeWeightField: String,
		modelId: { type: Schema.Types.ObjectId, ref: 'Model' },
		streamConfig: Object,
		timeUnit: String,
		collectionName: String,
		namespace: String,
		byoVectorDb: Boolean,
		region: String,
		cloud: String,
		vectordbtype: String
	},
	{ timestamps: true }
);

export type DatasourceDocument = InferSchemaType<typeof datasourceSchema>;

export const DataSourceModel =
	models?.datasource || model<Datasource>('datasource', datasourceSchema);
