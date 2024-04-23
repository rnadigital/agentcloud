'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export enum Retriever {
	DEFAULT = 'default',        // vectorstore similarity search
	SELF_QUERY = 'self_query',
	TIME_WEIGHTED = 'time_weighted'
}

export type Tool = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
    name: string;
    description: string;
 	type: ToolType;
 	schema?: string;
 	retriever?: Retriever;
 	datasourceId?: ObjectId;
	data?: {
		builtin?: boolean;
		name: string;
		description?: string;
		parameters?: {
			//type: string;
			properties: Record<string,FunctionProperty>;
			required?: string[];
		};
		code?: string;
		openAPIMatchKey?: string;
	},
	credentialId?: ObjectId; //links to a credential 
	icon?: IconAttachment;
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
