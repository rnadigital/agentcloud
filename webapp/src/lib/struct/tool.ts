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
		parameters?: { // TODO: rename "functionParameters"
			//type: string;
			properties: Record<string, FunctionProperty>;
			required?: string[];
		};
		code?: string;
		openAPIMatchKey?: string;
	};
	requiredParameters?: {
		required: string[];
		properties: Record<string, FunctionProperty>;
	};
	parameters?: Record<string, string>;
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
