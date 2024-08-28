'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export enum Retriever {
	RAW = 'raw',
	SELF_QUERY = 'self_query',
	TIME_WEIGHTED = 'time_weighted',
	MULTI_QUERY = 'multi_query'
}

export type MetadataFieldInfo = {
	name: string;
	description: string;
	type: 'string' | 'integer' | 'float';
};

export type SelfQueryRetrieverConfig = {
	k?: number;
	metadata_field_info: MetadataFieldInfo[];
};

export type TimeWeightedRetrieverConfig = {
	k?: number;
	decay_rate?: number;
};

export type SimilaritySearchRetrieverConfig = {
	k?: number;
	//TODO: any specific configs?
};

export type MultiQueryRetrieverConfig = {
	k?: number;
	//TODO: any specific configs?
};

export type RetrieverConfig = SelfQueryRetrieverConfig | TimeWeightedRetrieverConfig;

export enum ToolState {
	PENDING = 'pending',
	READY = 'ready',
	ERROR = 'error'
}

export type Tool = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	description: string;
	type: ToolType;
	schema?: string;
	retriever_type?: Retriever;
	retriever_config?: RetrieverConfig;
	datasourceId?: ObjectId;
	state?: ToolState;
	data?: {
		runtime?: string;
		builtin?: boolean;
		name: string;
		description?: string;
		apiKey?: string;
		environmentVariables?: Record<string, string>;
		parameters?: {
			//type: string;
			properties: Record<string, FunctionProperty>;
			required?: string[];
		};
		code?: string;
		requirements?: string;
		openAPIMatchKey?: string;
	};
	icon?: IconAttachment;
	hidden?: boolean;
	functionId?: string;
	revisionId?: ObjectId;
	functionLogs?: string;
};

export type FunctionProperty = {
	type: string; // should probably be string | number | whatever
	description: string;
};

export enum ToolType {
	FUNCTION_TOOL = 'function',
	RAG_TOOL = 'rag'
}

export const ToolTypes = Object.values(ToolType);

export enum BaseOpenAPIParameters {
	BASE_URL = '__baseurl',
	PATH = '__path',
	METHOD = '__method'
}

/**
 * @openapi
 *  components:
 *   schemas:
 *    Retriever:
 *     type: string
 *     description: Enum representing different types of retrievers used in tools.
 *     enum:
 *      - raw
 *      - self_query
 *      - time_weighted
 *      - multi_query
 *
 *    ToolType:
 *     type: string
 *     description: Enum representing different types of tools.
 *     enum:
 *      - function
 *      - rag
 *
 *    ToolState:
 *     type: string
 *     description: Enum representing the possible states of a tool.
 *     enum:
 *      - pending
 *      - ready
 *      - error
 *
 *    BaseOpenAPIParameters:
 *     type: string
 *     description: Enum representing base OpenAPI parameters.
 *     enum:
 *      - __baseurl
 *      - __path
 *      - __method
 *
 *    MetadataFieldInfo:
 *     type: object
 *     description: Information about a metadata field used in retriever configurations.
 *     required:
 *      - name
 *      - description
 *      - type
 *     properties:
 *      name:
 *       description: The name of the metadata field.
 *       type: string
 *      description:
 *       description: A description of the metadata field.
 *       type: string
 *      type:
 *       description: The data type of the metadata field.
 *       type: string
 *       enum:
 *        - string
 *        - integer
 *        - float
 *
 *    SelfQueryRetrieverConfig:
 *     type: object
 *     description: Configuration for the self-query retriever.
 *     required:
 *      - metadata_field_info
 *     properties:
 *      k:
 *       description: Number of results to retrieve.
 *       type: integer
 *       format: int32
 *      metadata_field_info:
 *       description: Array of metadata field information objects.
 *       type: array
 *       items:
 *        $ref: '#/components/schemas/MetadataFieldInfo'
 *
 *    TimeWeightedRetrieverConfig:
 *     type: object
 *     description: Configuration for the time-weighted retriever.
 *     properties:
 *      k:
 *       description: Number of results to retrieve.
 *       type: integer
 *       format: int32
 *      decay_rate:
 *       description: Decay rate applied to the time weighting.
 *       type: number
 *       format: float
 *
 *    SimilaritySearchRetrieverConfig:
 *     type: object
 *     description: Configuration for the similarity search retriever.
 *     properties:
 *      k:
 *       description: Number of results to retrieve.
 *       type: integer
 *       format: int32
 *       # TODO: Add specific configuration fields as needed
 *
 *    MultiQueryRetrieverConfig:
 *     type: object
 *     description: Configuration for the multi-query retriever.
 *     properties:
 *      k:
 *       description: Number of results to retrieve.
 *       type: integer
 *       format: int32
 *       # TODO: Add specific configuration fields as needed
 *
 *    RetrieverConfig:
 *     type: object
 *     description: Union type representing different retriever configurations.
 *     oneOf:
 *      - $ref: '#/components/schemas/SelfQueryRetrieverConfig'
 *      - $ref: '#/components/schemas/TimeWeightedRetrieverConfig'
 *
 *    FunctionProperty:
 *     type: object
 *     description: Defines the properties of a function parameter in a tool.
 *     required:
 *      - type
 *      - description
 *     properties:
 *      type:
 *       description: The data type of the function property.
 *       type: string
 *      description:
 *       description: A description of the function property.
 *       type: string
 *
 *    Tool:
 *     type: object
 *     description: Represents a tool within the system, including its configuration, state, and associated retrievers.
 *     required:
 *      - name
 *      - description
 *      - type
 *      - data
 *     properties:
 *      _id:
 *       description: Unique identifier for the tool.
 *       $ref: '#/components/schemas/ObjectId'
 *      orgId:
 *       description: Identifier of the organization to which the tool belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      teamId:
 *       description: Identifier of the team to which the tool belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      name:
 *       description: The name of the tool.
 *       type: string
 *      description:
 *       description: A detailed description of the tool.
 *       type: string
 *      type:
 *       description: The type of tool.
 *       $ref: '#/components/schemas/ToolType'
 *      schema:
 *       description: The schema associated with the tool.
 *       type: string
 *      retriever_type:
 *       description: The type of retriever used by the tool.
 *       $ref: '#/components/schemas/Retriever'
 *      retriever_config:
 *       description: Configuration settings for the retriever.
 *       $ref: '#/components/schemas/RetrieverConfig'
 *      datasourceId:
 *       description: Identifier of the datasource associated with the tool.
 *       $ref: '#/components/schemas/ObjectId'
 *      state:
 *       description: The current state of the tool.
 *       $ref: '#/components/schemas/ToolState'
 *      data:
 *       type: object
 *       description: Data related to the tool, including runtime, environment variables, and more.
 *       required:
 *        - name
 *       properties:
 *        runtime:
 *         description: The runtime environment for the tool.
 *         type: string
 *        builtin:
 *         description: Indicates if the tool is a built-in feature.
 *         type: boolean
 *        name:
 *         description: The name of the data.
 *         type: string
 *        description:
 *         description: A description of the data.
 *         type: string
 *        apiKey:
 *         description: API key associated with the tool.
 *         type: string
 *        environmentVariables:
 *         description: Environment variables required by the tool.
 *         type: object
 *         additionalProperties:
 *          type: string
 *        parameters:
 *         type: object
 *         description: Parameters for the tool's function.
 *         properties:
 *          properties:
 *           description: Properties of the function parameters.
 *           type: object
 *           additionalProperties:
 *            $ref: '#/components/schemas/FunctionProperty'
 *          required:
 *           description: List of required parameter names.
 *           type: array
 *           items:
 *            type: string
 *        code:
 *         description: Code associated with the tool.
 *         type: string
 *        requirements:
 *         description: Requirements needed by the tool.
 *         type: string
 *        openAPIMatchKey:
 *         description: Key used to match OpenAPI specifications.
 *         type: string
 *      icon:
 *       description: Icon associated with the tool.
 *       $ref: '#/components/schemas/IconAttachment'
 *      hidden:
 *       description: Indicates whether the tool is hidden.
 *       type: boolean
 *      functionId:
 *       description: Identifier of the function associated with the tool.
 *       type: string
 *      revisionId:
 *       description: Identifier of the tool's revision.
 *       $ref: '#/components/schemas/ObjectId'
 *      functionLogs:
 *       description: Logs related to the function's execution.
 *       type: string
 */
