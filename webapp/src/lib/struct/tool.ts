'use strict';

export type FunctionProperty = {
	type: string; // should probably be string | number | whatever
	description: string;
};

export enum ToolType {
	API_TOOL = 'api',
	HOSTED_FUNCTION_TOOL = 'function',
}

export const ToolTypes = Object.values(ToolType);

export enum BaseOpenAPIParameters {
	BASE_URL = '__baseurl',
	PATH = '__path',
	METHOD = '__method'
}