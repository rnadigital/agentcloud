'use strict';

import { ObjectId } from 'mongodb';

export type Tool = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
    name: string;
 	type: ToolType;
 	schema?: string; //NOTE: not really used since the function description and params are based on one function
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
