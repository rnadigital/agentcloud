'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';
import { RagFilter } from 'struct/qdrantfilter';

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
	timeWeightField: string;
};

export type SimilaritySearchRetrieverConfig = {
	k?: number;
	//TODO: any specific configs?
};

export type MultiQueryRetrieverConfig = {
	k?: number;
	//TODO: any specific configs?
};

export type RetrieverConfig = SelfQueryRetrieverConfig & TimeWeightedRetrieverConfig;

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
		environmentVariables?: Record<string, string>;
		parameters?: {
			properties: Record<string, FunctionProperty>;
			required?: string[];
		};
		code?: string;
		requirements?: string;
	};
	requiredParameters?: {
		required: string[];
		properties: Record<string, FunctionProperty>;
	};
	parameters?: Record<string, string>;
	ragFilters?: RagFilter; //TODO: OR pinecone type
	icon?: IconAttachment;
	hidden?: boolean;
	functionId?: string;
	revisionId?: ObjectId;
	functionLogs?: string;
	linkedToolId?: ObjectId;
};

export type FunctionProperty = {
	type: string;
	description: string;
};

export enum ToolType {
	FUNCTION_TOOL = 'function',
	RAG_TOOL = 'rag',
	BUILTIN_TOOL = 'builtin'
	//To prevent considering installed tools "function" and counting towards limits, etc
	//TODO: remove data.builtin
}

export const ToolTypes = Object.values(ToolType);

export enum BaseOpenAPIParameters {
	BASE_URL = '__baseurl',
	PATH = '__path',
	METHOD = '__method'
}
