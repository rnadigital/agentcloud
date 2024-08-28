'use strict';

import { ObjectId } from 'mongodb';
//RMDVLP: just make this pretty empty, just need it as a reference for controller documentation
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

export const SyncModes = [
	'full_refresh_overwrite',
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

export function getMetadataFieldInfo(config: StreamConfigMap) {
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
	streamConfig?: StreamConfigMap;
	timeUnit?: string; //temp until we have a more robust way to limit cron frequency based on plan
};


/**
 * @openapi
 *  components:
 *   schemas:
 *    DatasourceStream:
 *     type: object
 *     description: Represents a data stream configuration for a datasource, typically used with Airbyte integrations.
 *     required:
 *      - syncMode
 *      - name
 *     properties:
 *      syncMode:
 *       description: The synchronization mode for the stream. This should match the enum values defined by the Airbyte API.
 *       type: string
 *       enum: 
 *        # Add the specific enum values here based on the Airbyte API
 *      name:
 *       description: The name of the data stream.
 *       type: string
 */



/**
 * @openapi
 *  components:
 *   schemas:
 *    DatasourceConnectionSettings:
 *     type: object
 *     description: Configuration settings for a datasource connection, including scheduling, data residency, and namespace details.
 *     required:
 *      - prefix
 *      - name
 *      - sourceId
 *      - destinationId
 *      - status
 *      - configurations
 *      - nonBreakingSchemaUpdatesBehavior
 *     properties:
 *      prefix:
 *       description: Optional prefix to be added to the destination's namespace. Can be null.
 *       type: string
 *       nullable: true
 *      name:
 *       description: The name of the datasource connection.
 *       type: string
 *      sourceId:
 *       description: The identifier of the data source.
 *       type: string
 *      destinationId:
 *       description: The identifier of the data destination.
 *       type: string
 *      status:
 *       description: The status of the datasource connection. This should match the enum values defined by the Airbyte API and should allow creation in a paused state.
 *       type: string
 *       # Add the specific enum values here based on the Airbyte API
 *      configurations:
 *       description: Configuration settings for the datasource connection. Structure is dependent on the datasource type.
 *       type: object
 *      schedule:
 *       type: object
 *       description: Scheduling information for the datasource connection.
 *       properties:
 *        scheduleType:
 *         description: The type of schedule for the datasource connection.
 *         type: string
 *         enum:
 *          - cron
 *          - manual
 *        cronExpression:
 *         description: The CRON expression for scheduling, required if the schedule type is 'cron'.
 *         type: string
 *         nullable: true
 *      dataResidency:
 *       description: Specifies where the data should be stored geographically.
 *       type: string
 *       nullable: true
 *      namespaceDefinition:
 *       description: Defines how the namespace should be determined for the data.
 *       type: string
 *       nullable: true
 *      namespaceFormat:
 *       description: The format of the namespace, can be null if not applicable.
 *       type: string
 *       nullable: true
 *      nonBreakingSchemaUpdatesBehavior:
 *       description: Specifies the behavior for handling non-breaking schema updates.
 *       type: string
 */


/**
 * @openapi
 *  components:
 *   schemas:
 *    DatasourceRecordCount:
 *     type: object
 *     description: Represents the record count information for a datasource, including total, successful, and failed records.
 *     properties:
 *      total:
 *       description: The total number of records processed.
 *       type: integer
 *       format: int32
 *      success:
 *       description: The number of successfully processed records.
 *       type: integer
 *       format: int32
 *      failure:
 *       description: The number of records that failed to process.
 *       type: integer
 *       format: int32
 */


/**
 * @openapi
 *  components:
 *   schemas:
 *    FieldDescription:
 *     type: object
 *     description: Provides details about a specific field, including its description and type.
 *     required:
 *      - description
 *      - type
 *     properties:
 *      description:
 *       description: A textual description of the field.
 *       type: string
 *      type:
 *       description: The data type of the field.
 *       type: string
 *    
 *    FieldDescriptionMap:
 *     type: object
 *     description: A mapping of field names to their descriptions.
 *     additionalProperties:
 *      $ref: '#/components/schemas/FieldDescription'

 *    StreamConfig:
 *     type: object
 *     description: Configuration settings for a specific stream, used to break down large volumes of data into smaller, manageable chunks for processing.
 *     required:
 *      - checkedChildren
 *      - primaryKey
 *      - syncMode
 *      - cursorField
 *      - descriptionsMap
 *     properties:
 *      checkedChildren:
 *       description: List of child stream identifiers that are checked for inclusion in the sync.
 *       type: array
 *       items:
 *        type: string
 *      primaryKey:
 *       description: List of fields that make up the primary key for the stream.
 *       type: array
 *       items:
 *        type: string
 *      syncMode:
 *       description: The synchronization mode used for the stream.
 *       type: string
 *       # Define the possible enum values for SyncMode if applicable
 *      cursorField:
 *       description: List of fields that act as the cursor for incremental syncs.
 *       type: array
 *       items:
 *        type: string
 *      descriptionsMap:
 *       description: A map of field names to their descriptions.
 *       $ref: '#/components/schemas/FieldDescriptionMap'

 *    StreamConfigMap:
 *     type: object
 *     description: A mapping of stream names to their respective configuration settings.
 *     additionalProperties:
 *      $ref: '#/components/schemas/StreamConfig'
 */



/**
 * @openapi
 *  components:
 *   schemas:
 *    Datasource:
 *     type: object
 *     description: Represents a data source configuration within the system, including connection details, status, chunking configurations, and record counts.
 *     required:
 *      - name
 *      - originalName
 *      - sourceType
 *      - sourceId
 *      - destinationId
 *      - workspaceId
 *      - connectionId
 *      - createdDate
 *     properties:
 *      _id:
 *       description: Unique identifier for the datasource.
 *       $ref: '#/components/schemas/ObjectId'
 *      orgId:
 *       description: Identifier of the organization to which the datasource belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      teamId:
 *       description: Identifier of the team to which the datasource belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      name:
 *       description: The name of the datasource.
 *       type: string
 *      description:
 *       description: Optional description of the datasource.
 *       type: string
 *      originalName:
 *       description: The original name of the datasource.
 *       type: string
 *      filename:
 *       description: The name of the file associated with the datasource, if applicable.
 *       type: string
 *       nullable: true
 *      sourceType:
 *       description: The type of source for the datasource.
 *       type: string
 *      sourceId:
 *       description: The identifier of the data source.
 *       type: string
 *      destinationId:
 *       description: The identifier of the data destination.
 *       type: string
 *      workspaceId:
 *       description: The identifier of the workspace associated with the datasource.
 *       type: string
 *      connectionId:
 *       description: The identifier of the connection associated with the datasource.
 *       type: string
 *      recordCount:
 *       description: The record count details for the datasource, including total, successful, and failed records.
 *       $ref: '#/components/schemas/DatasourceRecordCount'
 *      connectionSettings:
 *       description: Configuration settings for the datasource connection.
 *       $ref: '#/components/schemas/DatasourceConnectionSettings'
 *      createdDate:
 *       description: The date and time when the datasource was created.
 *       type: string
 *       format: date-time
 *      lastSyncedDate:
 *       description: The date and time when the datasource was last synced. Null indicates it has never been synced.
 *       type: string
 *       format: date-time
 *       nullable: true
 *      status:
 *       description: The current status of the datasource.
 *       type: string
 *       enum:
 *        - draft
 *        - processing
 *        - embedding
 *        - ready
 *      discoveredSchema:
 *       description: Schema discovered during the data source connection. The structure depends on the source type.
 *       type: object
 *       nullable: true
 *      chunkingConfig:
 *       description: Configuration settings for chunking unstructured data, including partitioning and chunking strategies, character limits, and similarity thresholds.
 *       $ref: '#/components/schemas/UnstructuredChunkingConfig'
 *      embeddingField:
 *       description: The field used for embedding within the datasource.
 *       type: string
 *      timeWeightField:
 *       description: The field used to apply time weighting within the datasource.
 *       type: string
 *      modelId:
 *       description: Identifier of the embedding model used, if applicable.
 *       $ref: '#/components/schemas/ObjectId'
 *      hidden:
 *       description: Indicates whether the datasource is hidden from standard views.
 *       type: boolean
 *      streamConfig:
 *       description: Configuration settings for processing streams of data, breaking them into smaller chunks for more manageable processing.
 *       $ref: '#/components/schemas/StreamConfigMap'
 *      timeUnit:
 *       description: A temporary field to limit CRON frequency based on the plan. This will be replaced with a more robust solution in the future.
 *       type: string
 */
