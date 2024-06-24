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
	decay_rate?: number;
};

export type RetrieverConfig = SelfQueryRetrieverConfig | TimeWeightedRetrieverConfig;

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
	data?: {
		builtin?: boolean;
		name: string;
		description?: string;
		environmentVariables?: Record<string,string>;
		parameters?: {
			//type: string;
			properties: Record<string,FunctionProperty>;
			required?: string[];
		};
		code?: string;
		openAPIMatchKey?: string;
	},
	icon?: IconAttachment;
	hidden?: boolean;
};

export type FunctionProperty = {
	type: string; // should probably be string | number | whatever
	description: string;
};

export enum ToolType {
	API_TOOL = 'api',
	FUNCTION_TOOL = 'function',
	RAG_TOOL = 'rag',
}

export const ToolTypes = Object.values(ToolType);

export enum BaseOpenAPIParameters {
	BASE_URL = '__baseurl',
	PATH = '__path',
	METHOD = '__method'
}
