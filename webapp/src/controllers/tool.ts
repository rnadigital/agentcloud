'use strict';

import { dynamicResponse } from '@dr';
import { removeAgentsTool } from 'db/agent';
import { getAssetById } from 'db/asset';
import { getDatasourceById, getDatasourcesByTeam } from 'db/datasource';
import { addTool, deleteToolById, editTool, getToolById, getToolsByTeam } from 'db/tool';
import FunctionProviderFactory from 'lib/function';
import toObjectId from 'misc/toobjectid';
import toSnakeCase from 'misc/tosnakecase';
import { runtimeValues } from 'struct/function';
import { Retriever,ToolType, ToolTypes } from 'struct/tool';
import { chainValidations } from 'utils/validationUtils';

export async function toolsData(req, res, _next) {
	const [tools, datasources] = await Promise.all([
		getToolsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		datasources,
	};
}

/**
 * GET /[resourceSlug]/tools
 * tool page html
 */
export async function toolsPage(app, req, res, next) {
	const data = await toolsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/tools`);
}

/**
 * GET /[resourceSlug]/tools.json
 * team tools json data
 */
export async function toolsJson(req, res, next) {
	const data = await toolsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function toolData(req, res, _next) {
	const [tool, datasources] = await Promise.all([
		getToolById(req.params.resourceSlug, req.params.toolId),
		getDatasourcesByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		tool,
		datasources,
	};
}

/**
 * GET /[resourceSlug]/tool/:toolId.json
 * tool json data
 */
export async function toolJson(req, res, next) {
	const data = await toolsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/tool/:toolId/edit
 * tool json data
 */
export async function toolEditPage(app, req, res, next) {
	const data = await toolData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/tool/${data.tool._id}/edit`);
}
 
/**
 * GET /[resourceSlug]/tool/add
 * tool json data
 */
export async function toolAddPage(app, req, res, next) {
	const data = await toolData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/tool/add`);
}

function validateTool(tool) {
	return chainValidations(tool, [
		{ field: 'name', validation: { notEmpty: true }},
		{ field: 'type', validation: { notEmpty: true, inSet: new Set(Object.values(ToolTypes))}},
		{ field: 'retriever', validation: { notEmpty: true, inSet: new Set(Object.values(Retriever))}},
		{ field: 'description', validation: { notEmpty: true, lengthMin: 2 }, validateIf: { field: 'type', condition: (value) => value === ToolType.RAG_TOOL }},
		{ field: 'datasourceId', validation: { notEmpty: true, hasLength: 24, customError: 'Invalid data sources' }, validateIf: { field: 'type', condition: (value) => value == ToolType.RAG_TOOL }},
		{ field: 'data.description', validation: { notEmpty: true }, validateIf: { field: 'type', condition: (value) => value !== ToolType.RAG_TOOL }},
		{ field: 'data.parameters', validation: { notEmpty: true }, validateIf: { field: 'type', condition: (value) => value !== ToolType.RAG_TOOL }},
		{ field: 'data.environmentVariables', validation: { notEmpty: true }, validateIf: { field: 'type', condition: (value) => value !== ToolType.RAG_TOOL }},
		{ field: 'schema', validation: { notEmpty: true }, validateIf: { field: 'type', condition: (value) => value == ToolType.API_TOOL }},
		{ field: 'naame', validation: { regexMatch: new RegExp('^[\\w_][A-Za-z0-9_]*$','gm'),
			customError: 'Name must not contain spaces or start with a number. Only alphanumeric and underscore characters allowed' },
		validateIf: { field: 'type', condition: (value) => value == ToolType.API_TOOL }},
		{ field: 'data.parameters.properties', validation: { objectHasKeys: true }, validateIf: { field: 'type', condition: (value) => value == ToolType.API_TOOL }},
		{ field: 'data.parameters.code', validation: { objectHasKeys: true }, validateIf: { field: 'type', condition: (value) => value == ToolType.FUNCTION_TOOL }},
	], { 
		name: 'Name',
		retriever_type: 'Retrieval Strategy',
		type: 'Type',
		'data.builtin': 'Is built-in',
		'data.description': 'Description',
		'data.parameters': 'Parameters',
		'data.parameters.properties': '',
		'data.parameters.code': ''
	});
}

export async function addToolApi(req, res, next) {

	const { name, type, data, schema, datasourceId, description, iconId, retriever, retriever_config, runtime }  = req.body;

	const validationError = validateTool(req.body);
	if (validationError) {	
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (datasourceId && (typeof datasourceId !== 'string' || datasourceId.length !== 24)) {
		const foundDatasource = await getDatasourceById(req.params.resourceSlug, datasourceId);
		if (!foundDatasource) {
			return dynamicResponse(req, res, 400, { error: 'Invalid datasource IDs' });
		}
	}
	
	if (runtime && (typeof runtime !== 'string' || !runtimeValues.includes(runtime))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid runtime' });
	}

	const foundIcon = await getAssetById(iconId);

	const toolData = {
		...data,
		builtin: false,
		name: (type as ToolType) === ToolType.API_TOOL
			? 'openapi_request'
			: ((type as ToolType) === ToolType.FUNCTION_TOOL 
				? toSnakeCase(name)
				: name),
	};
	const addedTool = await addTool({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
	    name,
	    description,
	 	type: type as ToolType,
		datasourceId: toObjectId(datasourceId),
	 	retriever_type: retriever || null,
	 	retriever_config: retriever_config || {}, //TODO: validation
	 	schema: schema,
		data: toolData,
		icon: foundIcon ? {
			id: foundIcon._id,
			filename: foundIcon.filename,
		} : null,
	});

	if (type as ToolType === ToolType.FUNCTION_TOOL) {
		const functionProvider = FunctionProviderFactory.getFunctionProvider();
		const addedToolId = addedTool.insertedId.toString();
		await functionProvider.deployFunction({
			code: toolData?.code,
			requirements: toolData?.requirements,
			environmentVariables: toolData?.environmentVariables,
			mongoId: toolData?.addedToolId,
			runtime,
		});
	}

	return dynamicResponse(req, res, 302, { _id: addedTool.insertedId, redirect: `/${req.params.resourceSlug}/tools` });

}

export async function editToolApi(req, res, next) {

	const { name, type, data, toolId, schema, description, datasourceId, retriever, retriever_config, runtime }  = req.body;

	const validationError = validateTool(req.body);
	if (validationError) {	
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (datasourceId && (typeof datasourceId !== 'string' || datasourceId.length !== 24)) {
		const foundDatasource = await getDatasourceById(req.params.resourceSlug, datasourceId);
		if (!foundDatasource) {
			return dynamicResponse(req, res, 400, { error: 'Invalid datasource IDs' });
		}
	}

	//Need the existing tool type to know whether we should delete an existing deployed function
	const existingTool = await getToolById(req.params.resourceSlug, toolId);

	const toolData = {
		...data,
		builtin: false,
		name: (type as ToolType) === ToolType.API_TOOL
			? 'openapi_request'
			: ((type as ToolType) === ToolType.FUNCTION_TOOL 
				? toSnakeCase(name)
				: name),
	};
	await editTool(req.params.resourceSlug, toolId, {
	    name,
	 	type: type as ToolType,
	    description,
	 	schema: schema,
	 	datasourceId: toObjectId(datasourceId),
	 	retriever_type: retriever || null,
	 	retriever_config: retriever_config || {}, //TODO: validation
		data: toolData,
	});

	let functionProvider;
	if (existingTool.type as ToolType === ToolType.FUNCTION_TOOL && type as ToolType !== ToolType.FUNCTION_TOOL) {
		functionProvider = FunctionProviderFactory.getFunctionProvider();
		await functionProvider.deleteFunction(toolId.toString());
	} else if (type as ToolType === ToolType.FUNCTION_TOOL) {
		!functionProvider && (functionProvider = FunctionProviderFactory.getFunctionProvider());
		await functionProvider.deployFunction({
			code: toolData?.code,
			requirements: toolData?.requirements,
			environmentVariables: toolData?.environmentVariables,
			mongoId: toolId,
			runtime,
		});
	}

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/tools`*/ });

}

/**
 * @api {delete} /forms/tool/[toolId] Delete a tool
 * @apiName delete
 * @apiGroup Tool
 *
 * @apiParam {String} toolID tool id
 */
export async function deleteToolApi(req, res, next) {

	const { toolId } = req.body;

	if (!toolId || typeof toolId !== 'string' || toolId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await Promise.all([
		deleteToolById(req.params.resourceSlug, toolId),
		removeAgentsTool(req.params.resourceSlug, toolId),
	]);

	const existingTool = await getToolById(req.params.resourceSlug, toolId);
	if (existingTool.type as ToolType === ToolType.FUNCTION_TOOL) {
		const functionProvider = FunctionProviderFactory.getFunctionProvider();
		await functionProvider.deleteFunction(toolId.toString());
	}

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/agents`*/ });

}
