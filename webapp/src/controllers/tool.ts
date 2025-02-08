'use strict';

import { isDeepStrictEqual } from 'node:util';

import { dynamicResponse } from '@dr';
import { io } from '@socketio';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { removeAgentsTool } from 'db/agent';
import { addAsset, attachAssetToObject, deleteAssetById, getAssetById } from 'db/asset';
import { getDatasourceById, getDatasourcesByTeam } from 'db/datasource';
import { addNotification } from 'db/notification';
import {
	addTool,
	deleteToolById,
	deleteToolByIdReturnTool,
	editTool,
	editToolUnsafe,
	getToolById,
	getToolsByTeam,
	getToolsForDatasource,
	updateToolGetOldTool
} from 'db/tool';
import {
	addToolRevision,
	deleteRevisionsForTool,
	deleteToolRevisionById,
	getRevisionsForTool,
	getToolRevisionById
} from 'db/toolrevision';
import debug from 'debug';
import FunctionProviderFactory from 'lib/function';
import getDotProp from 'lib/misc/getdotprop';
import StorageProviderFactory from 'lib/storage';
import toObjectId from 'misc/toobjectid';
import toSnakeCase from 'misc/tosnakecase';
import { ObjectId } from 'mongodb';
import path from 'path';
import { Asset, IconAttachment } from 'struct/asset';
import { PlanLimitsKeys } from 'struct/billing';
import { getMetadataFieldInfo } from 'struct/datasource';
import { CollectionName } from 'struct/db';
import { runtimeValues } from 'struct/function';
import { NotificationDetails, NotificationType, WebhookType } from 'struct/notification';
import { Retriever, Tool, ToolState, ToolType, ToolTypes } from 'struct/tool';
import { chainValidations } from 'utils/validationutils';
import { v4 as uuidv4 } from 'uuid';

import { RagFilterSchema } from '../lib/struct/editorschemas';
import { cloneAssetInStorageProvider } from './asset';
const ajv = new Ajv({ strict: 'log' });
addFormats(ajv);
const log = debug('webapp:controllers:tool');

export async function toolsData(req, res, _next) {
	const [tools, datasources] = await Promise.all([
		getToolsByTeam(req.params.resourceSlug),
		getDatasourcesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		datasources
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
	const [tool, revisions, datasources] = await Promise.all([
		getToolById(req.params.resourceSlug, req.params.toolId),
		getRevisionsForTool(req.params.resourceSlug, req.params.toolId),
		getDatasourcesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tool,
		revisions,
		datasources
	};
}

/**
 * GET /[resourceSlug]/tool/:toolId.json
 * tool json data
 */
export async function toolJson(req, res, next) {
	const data = await toolData(req, res, next);
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
	const toolType = tool.type;

	return chainValidations(
		tool,
		[
			{ field: 'name', validation: { notEmpty: true } },
			{ field: 'type', validation: { notEmpty: true, inSet: new Set(Object.values(ToolTypes)) } },
			{
				field: 'retriever',
				validation: {
					notEmpty: true,
					inSet: new Set(Object.values(Retriever))
				},
				validateIf: { field: 'type', condition: value => value === ToolType.RAG_TOOL }
			},
			{
				field: 'description',
				validation: { notEmpty: true, lengthMin: 2 },
				validateIf: { field: 'type', condition: value => value === ToolType.RAG_TOOL }
			},
			{
				field: 'datasourceId',
				validation: {
					notEmpty: toolType === ToolType.RAG_TOOL,
					hasLength: 24,
					customError: 'Invalid data sources'
				},
				validateIf: { field: 'type', condition: value => value == ToolType.RAG_TOOL }
			},
			{
				field: 'data.description',
				validation: { notEmpty: true },
				validateIf: { field: 'type', condition: value => value !== ToolType.RAG_TOOL }
			},
			{
				field: 'data.parameters',
				validation: { notEmpty: true },
				validateIf: { field: 'type', condition: value => value !== ToolType.RAG_TOOL }
			},
			{
				field: 'data.environmentVariables',
				validation: { notEmpty: true },
				validateIf: {
					field: 'type',
					condition: value => value === ToolType.FUNCTION_TOOL
				}
			},
			{
				field: 'data.parameters.code',
				validation: { objectHasKeys: true },
				validateIf: { field: 'type', condition: value => value == ToolType.FUNCTION_TOOL }
			}
		],
		{
			name: 'Name',
			retriever_type: 'Retrieval Strategy',
			type: 'Type',
			'data.builtin': 'Is built-in',
			'data.description': 'Description',
			'data.parameters': 'Parameters',
			'data.parameters.properties': '',
			'data.parameters.code': ''
		}
	);
}

export async function addToolApi(req, res, next) {
	const {
		name,
		type,
		data,
		schema,
		datasourceId,
		description,
		parameters,
		iconId,
		retriever,
		retriever_config,
		linkedToolId,
		cloning,
		ragFilters
	} = req.body;

	const validationError = validateTool(req.body); //TODO: reject if function tool type

	if (
		(type as ToolType) === ToolType.FUNCTION_TOOL &&
		res.locals.usage[PlanLimitsKeys.maxFunctionTools] >=
			res.locals.limits[PlanLimitsKeys.maxFunctionTools]
	) {
		return dynamicResponse(req, res, 400, {
			error: `You have reached the limit of ${res.locals.limits[PlanLimitsKeys.maxFunctionTools]} custom functions allowed by your current plan. To add more custom functions, please upgrade your plan.`
		});
	}

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const isFunctionTool = (type as ToolType) === ToolType.FUNCTION_TOOL;

	if (Object.keys(ragFilters || {}).length > 0 && !isFunctionTool) {
		const validate = ajv.compile(RagFilterSchema);
		log('validate', validate);
		const validated = validate(ragFilters);
		if (!validated) {
			return dynamicResponse(req, res, 400, { error: 'Invalid Filters' });
		}
	}

	if (
		data?.runtime &&
		(typeof data?.runtime !== 'string' || !runtimeValues.includes(data?.runtime))
	) {
		return dynamicResponse(req, res, 400, { error: 'Invalid runtime' });
	}

	const toolData = {
		...data,

		builtin: false,
		name: (type as ToolType) === ToolType.FUNCTION_TOOL ? toSnakeCase(name) : name
	};

	let linkedTool;
	if (linkedToolId) {
		linkedTool = await getToolById(req.params.resourceSlug, linkedToolId);
		if (!linkedTool) {
			return dynamicResponse(req, res, 400, { error: 'Invalid linked tool ID' }); //note: should never hit
		}
		toolData.parameters = linkedTool.data.parameters;
	}

	const functionId = isFunctionTool ? uuidv4() : null;

	const newToolId = new ObjectId();
	const collectionType = CollectionName.Tools;
	let attachedIconToTool = await cloneAssetInStorageProvider(
		iconId,
		cloning,
		newToolId,
		collectionType,
		req.params.resourceSlug
	);

	const addedTool = await addTool({
		_id: newToolId,
		orgId: toObjectId(res.locals.matchingOrg.id),
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		type: type as ToolType,
		datasourceId: toObjectId(datasourceId),
		retriever_type: retriever || null,
		retriever_config: retriever_config || {}, //TODO: validation
		schema: schema,
		data: toolData,
		icon: attachedIconToTool
			? {
					id: attachedIconToTool._id,
					filename: attachedIconToTool.filename,
					linkedId: newToolId
				}
			: null,
		state: linkedTool ? null : isFunctionTool ? ToolState.PENDING : ToolState.READY, //other tool types are always "ready" (for now)
		parameters,
		requiredParameters: linkedTool?.requiredParameters,
		functionId,
		linkedToolId: toObjectId(linkedToolId),
		...(ragFilters && !isFunctionTool ? { ragFilters } : {})
	});

	if (!addedTool?.insertedId) {
		return dynamicResponse(req, res, 400, { error: 'Error inserting tool into database' });
	}

	if (isFunctionTool) {
		const functionProvider = FunctionProviderFactory.getFunctionProvider();
		try {
			functionProvider
				.deployFunction({
					code: toolData?.code,
					requirements: toolData?.requirements,
					environmentVariables: toolData?.environmentVariables,
					id: functionId,
					runtime: toolData?.runtime
				})
				.then(() => {
					/* Waits for the function to be active (asynchronously)
					 * TODO: turn this into a job thats sent to bull and handled elsewhere
					 * to prevent issues of ephemeral webapp pods leaving functions in "pending" state
					 */
					functionProvider
						.waitForFunctionToBeActive(functionId)
						.then(async isActive => {
							const addedRevision = await addToolRevision({
								orgId: toObjectId(res.locals.matchingOrg.id),
								teamId: toObjectId(req.params.resourceSlug),
								toolId: addedTool?.insertedId,
								content: {
									//Note: any type, keeping it very loose for now
									data: toolData
								},
								date: new Date()
							});
							log('addToolApi functionId %s isActive %O', functionId, isActive);
							await new Promise(res => setTimeout(res, 30000));
							const logs = await functionProvider.getFunctionLogs(functionId).catch(e => {
								log(e);
							});
							log('functionId %s logs %O', functionId, logs);
							const editedRes = await editToolUnsafe(
								{
									_id: toObjectId(addedTool?.insertedId),
									teamId: toObjectId(req.params.resourceSlug),
									functionId,
									type: ToolType.FUNCTION_TOOL
								},
								{
									revisionId: toObjectId(addedRevision?.insertedId),
									state: isActive ? ToolState.READY : ToolState.ERROR,
									...(!isActive && logs ? { functionLogs: logs } : { functionLogs: null })
								}
							);
							if (editedRes.modifiedCount === 0) {
								/* If there were multiple current depoyments and this one happened out of order (late)
							  delete the function to not leave it orphaned*/
								log('Deleting and returning to prevent orphan functionId %s', functionId);
								return functionProvider.deleteFunction(functionId);
							} else if (!isActive) {
								// Delete the broken function
								log('Deleting broken functionId %s', functionId);
								functionProvider.deleteFunction(functionId);
							}
							const notification = {
								orgId: toObjectId(res.locals.matchingOrg.id),
								teamId: toObjectId(req.params.resourceSlug),
								target: {
									id: addedTool?.insertedId.toString(),
									collection: CollectionName.Tools,
									property: '_id',
									objectId: true
								},
								title: 'Tool Deployment',
								date: new Date(),
								seen: false,
								// stuff specific to notification type
								description: `Custom code tool "${name}" ${isActive ? 'deployed successfully' : 'failed to deploy'}.`,
								type: NotificationType.Tool,
								details: {
									// TODO: if possible in future include the failure reason/error logs in here, and attach to the tool as well
								} as NotificationDetails
							};
							await addNotification(notification);
							io.to(req.params.resourceSlug).emit('notification', notification);
						})
						.catch(e => {
							log('An error occurred while async deplopying function %s, %O', functionId, e);
						});
				});
		} catch (e) {
			console.error(e);
			// logging warnings only
			functionProvider.deleteFunction(functionId).catch(e => console.warn(e));
			editTool(req.params.resourceSlug, addedTool?.insertedId, { state: ToolState.ERROR }).catch(
				e => console.warn(e)
			);
			return dynamicResponse(req, res, 400, { error: 'Error deploying or testing function' });
		}
	}

	return dynamicResponse(req, res, 200, {
		_id: addedTool.insertedId /*, redirect: `/${req.params.resourceSlug}/tools`*/
	});
}

export async function editToolApi(req, res, next) {
	const {
		name,
		type,
		data,
		toolId,
		schema,
		description,
		datasourceId,
		retriever,
		retriever_config,
		parameters,
		iconId,
		ragFilters
	} = req.body;

	const validationError = validateTool(req.body); //TODO: reject if function tool type

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	let foundDatasource;
	if (datasourceId && (typeof datasourceId !== 'string' || datasourceId.length !== 24)) {
		foundDatasource = await getDatasourceById(req.params.resourceSlug, datasourceId);
		if (!foundDatasource) {
			return dynamicResponse(req, res, 400, { error: 'Invalid datasource IDs' });
		}
	}

	const existingTool = await getToolById(req.params.resourceSlug, toolId);
	if (!existingTool) {
		return dynamicResponse(req, res, 400, { error: 'Invalid toolId' });
	}

	if (
		(existingTool.type as ToolType) !== ToolType.FUNCTION_TOOL &&
		(type as ToolType) === ToolType.FUNCTION_TOOL &&
		res.locals.usage[PlanLimitsKeys.maxFunctionTools] >=
			res.locals.limits[PlanLimitsKeys.maxFunctionTools]
	) {
		return dynamicResponse(req, res, 400, {
			error: `You have reached the limit of ${res.locals.limits[PlanLimitsKeys.maxFunctionTools]} custom functions allowed by your current plan. To add more custom functions, please upgrade your plan.`
		});
	}

	//await FunctionProviderFactory.getFunctionProvider().getFunctionLogs('5ec2b2cb-e701-4713-9df7-c22208daaf06')
	//	.then(res => { log('function logs %s', res); })
	//	.catch(e => { log(e); });

	const isFunctionTool = (type as ToolType) === ToolType.FUNCTION_TOOL;

	if (Object.keys(ragFilters || {}).length > 0 && !isFunctionTool) {
		const validate = ajv.compile(RagFilterSchema);
		log('validate', validate);
		const validated = validate(ragFilters);
		if (!validated) {
			return dynamicResponse(req, res, 400, { error: 'Invalid Filters' });
		}
	}

	//Check if any keys that are used by the cloud function have changed
	const functionNeedsUpdate =
		isFunctionTool &&
		['data.environmentVariables', 'data.code', 'data.requirements', 'runtime'].some(k => {
			const current = getDotProp(req.body, k);
			const prev = getDotProp(existingTool, k);
			return !isDeepStrictEqual(current, prev);
		});
	log(
		'Tool %s (%s) functionNeedsUpdate: %s',
		existingTool?.name,
		existingTool?._id,
		functionNeedsUpdate
	);

	const toolData = {
		...data,
		builtin: false,
		name: (type as ToolType) === ToolType.FUNCTION_TOOL ? toSnakeCase(name) : name
	};

	/* TODO: fix this. for now we always set the metadata_field_info as copied from the datasource */
	let metadata_field_info = [];
	if (foundDatasource) {
		try {
			metadata_field_info = getMetadataFieldInfo(foundDatasource?.streamConfig);
		} catch (e) {
			log(e);
			//supress
		}
	}

	let attachedIconToTool = existingTool?.icon;
	if (existingTool?.icon?.id?.toString() !== iconId) {
		const collectionType = CollectionName.Agents;
		const newAttachment = await attachAssetToObject(iconId, req.params.toolId, collectionType);
		if (newAttachment) {
			attachedIconToTool = {
				id: newAttachment._id,
				filename: newAttachment.filename,
				linkedId: newAttachment.linkedToId
			};
		}
	}

	const oldTool = await updateToolGetOldTool(req.params.resourceSlug, toolId, {
		name,
		type: type as ToolType,
		description,
		schema: schema,
		datasourceId: toObjectId(datasourceId),
		retriever_type: retriever || null,
		retriever_config: { ...retriever_config, metadata_field_info },
		data: toolData,
		icon: attachedIconToTool ? (iconId ? attachedIconToTool : null) : null,
		parameters,
		...(functionNeedsUpdate ? { state: ToolState.PENDING } : {}),
		...(ragFilters && !isFunctionTool ? { ragFilters } : {})
	});

	if (oldTool?.icon?.id && oldTool?.icon?.id?.toString() !== iconId) {
		deleteAssetById(oldTool?.icon?.id);
	}
	let functionProvider;
	if (
		(existingTool.type as ToolType) === ToolType.FUNCTION_TOOL &&
		(type as ToolType) !== ToolType.FUNCTION_TOOL
	) {
		functionProvider = FunctionProviderFactory.getFunctionProvider();
		await functionProvider.deleteFunction(existingTool.functionId);
	} else if (functionNeedsUpdate) {
		!functionProvider && (functionProvider = FunctionProviderFactory.getFunctionProvider());
		const functionId = uuidv4();
		try {
			functionProvider
				.deployFunction({
					code: toolData?.code,
					requirements: toolData?.requirements,
					environmentVariables: toolData?.environmentVariables,
					id: functionId,
					runtime: toolData?.runtime
				})
				.then(() => {
					/* Waits for the function to be active (asynchronously)
					 * TODO: turn this into a job thats sent to bull and handled elsewhere
					 * to prevent issues of ephemeral webapp pods leaving functions in "pending" state
					 */
					functionProvider
						.waitForFunctionToBeActive(functionId)
						.then(async isActive => {
							log('editToolApi functionId %s isActive %O', functionId, isActive);
							/* Note: don't remove this static sleep. The purpose is to wait for google
							 * cloud logging to have the deployment failure message which comes after
							 * a DELAY even when the function is already in "failed" state */
							await new Promise(res => setTimeout(res, 30000));
							const logs = await functionProvider.getFunctionLogs(functionId).catch(e => {
								log(e);
							});
							log('functionId %s logs %O', functionId, logs);
							const addedRevision = await addToolRevision({
								orgId: toObjectId(res.locals.matchingOrg.id),
								teamId: toObjectId(req.params.resourceSlug),
								toolId: toObjectId(toolId),
								content: {
									//Note: any type, keeping it very loose for now
									data: toolData
								},
								date: new Date()
							});
							const editedRes = await editToolUnsafe(
								{
									_id: toObjectId(toolId),
									teamId: toObjectId(req.params.resourceSlug),
									state: ToolState.PENDING,
									//functionId: ...
									type: ToolType.FUNCTION_TOOL // Note: filter to only function tool so if they change the TYPE while its deploying we discard and delete the function to prevent orphan
								},
								{
									revisionId: toObjectId(addedRevision?.insertedId),
									state: isActive ? ToolState.READY : ToolState.ERROR,
									...(isActive ? { functionId } : {}), //overwrite functionId to new ID if it was successful
									...(!isActive && logs ? { functionLogs: logs } : { functionLogs: null })
								}
							);
							if (editedRes.modifiedCount === 0) {
								/* If there were multiple current depoyments and this one happened out of order (late)
							  delete the function to not leave it orphaned*/
								log('Deleting and returning to prevent orphan functionId %s', functionId);
								return functionProvider.deleteFunction(functionId);
							}
							const notification = {
								orgId: toObjectId(existingTool.orgId.toString()),
								teamId: toObjectId(existingTool.teamId.toString()),
								target: {
									id: existingTool._id.toString(),
									collection: CollectionName.Tools,
									property: '_id',
									objectId: true
								},
								title: 'Tool Deployment',
								date: new Date(),
								seen: false,
								// stuff specific to notification type
								description: `Custom code tool "${name}" ${isActive ? 'deployed successfully' : 'failed to deploy'}.`,
								type: NotificationType.Tool,
								details: {
									// TODO: if possible in future include the failure reason/error logs in here, and attach to the tool as well
								} as NotificationDetails
							};
							await addNotification(notification);
							io.to(req.params.resourceSlug).emit('notification', notification);
							if (!isActive) {
								// Delete the new broken function
								log('Deleting new broken functionId %s', functionId);
								functionProvider.deleteFunction(functionId);
							}
							if (isActive && existingTool?.functionId) {
								//Delete the old function with old functionid
								log('Deleting function with old functionId %s', functionId);
								functionProvider.deleteFunction(existingTool.functionId);
							}
						})
						.catch(e => {
							log('An error occurred while async deplopying function %s, %O', functionId, e);
						});
				});
		} catch (e) {
			console.error(e);
			// logging warnings only
			functionProvider.deleteFunction(functionId).catch(e => console.warn(e));
			editTool(req.params.resourceSlug, toolId, { state: ToolState.ERROR }).catch(e =>
				console.warn(e)
			);
			return dynamicResponse(req, res, 400, { error: 'Error deploying or testing function' });
		}
	}

	return dynamicResponse(req, res, 200, {
		functionNeedsUpdate /*, redirect: `/${req.params.resourceSlug}/tools`*/
	});
}

export async function applyToolRevisionApi(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[{ field: 'revisionId', validation: { notEmpty: true, ofType: 'string' } }],
		{ revisionId: 'Revision ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { revisionId } = req.body;

	const existingRevision = await getToolRevisionById(req.params.resourceSlug, revisionId);
	if (!existingRevision) {
		return dynamicResponse(req, res, 400, { error: 'Invalid revisionId' });
	}

	const existingTool = await getToolById(req.params.resourceSlug, existingRevision.toolId);
	if (!existingTool) {
		return dynamicResponse(req, res, 400, { error: 'Invalid toolId' });
	}

	const isFunctionTool = existingTool.type === ToolType.FUNCTION_TOOL;
	if (!isFunctionTool) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const toolData = existingRevision.content.data;

	await editTool(req.params.resourceSlug, existingRevision.toolId, {
		data: toolData,
		state: ToolState.PENDING
	});

	const functionProvider = FunctionProviderFactory.getFunctionProvider();
	const functionId = uuidv4();
	try {
		//TODO: refactor
		functionProvider
			.deployFunction({
				code: toolData?.code,
				requirements: toolData?.requirements,
				environmentVariables: toolData?.environmentVariables,
				id: functionId,
				runtime: toolData?.runtime
			})
			.then(() => {
				/* Waits for the function to be active (asynchronously)
				 * TODO: turn this into a job thats sent to bull and handled elsewhere
				 * to prevent issues of ephemeral webapp pods leaving functions in "pending" state
				 */
				functionProvider
					.waitForFunctionToBeActive(functionId)
					.then(async isActive => {
						log('editToolApi functionId %s isActive %O', functionId, isActive);
						await new Promise(res => setTimeout(res, 30000));
						const logs = await functionProvider.getFunctionLogs(functionId).catch(e => {
							log(e);
						});
						const editedRes = await editToolUnsafe(
							{
								_id: toObjectId(existingRevision.toolId),
								teamId: toObjectId(req.params.resourceSlug),
								state: ToolState.PENDING,
								//functionId: ...
								type: ToolType.FUNCTION_TOOL // Note: filter to only function tool so if they change the TYPE while its deploying we discard and delete the function to prevent orphan
							},
							{
								revisionId: toObjectId(revisionId),
								state: isActive ? ToolState.READY : ToolState.ERROR,
								...(isActive ? { functionId } : {}), //overwrite functionId to new ID if it was successful
								...(!isActive && logs ? { functionLogs: logs } : { functionLogs: null })
							}
						);
						if (editedRes.modifiedCount === 0) {
							/* If there were multiple current depoyments and this one happened out of order (late)
						  delete the function to not leave it orphaned*/
							log('Deleting and returning to prevent orphan functionId %s', functionId);
							return functionProvider.deleteFunction(functionId);
						}
						const notification = {
							orgId: toObjectId(existingTool.orgId.toString()),
							teamId: toObjectId(existingTool.teamId.toString()),
							target: {
								id: existingTool._id.toString(),
								collection: CollectionName.Tools,
								property: '_id',
								objectId: true
							},
							title: 'Tool Deployment',
							date: new Date(),
							seen: false,
							// stuff specific to notification type
							description: `Custom code tool "${existingTool.name}" ${isActive ? 'deployed successfully' : 'failed to deploy'}.`,
							type: NotificationType.Tool,
							details: {
								// TODO: if possible in future include the failure reason/error logs in here, and attach to the tool as well
							} as NotificationDetails
						};
						await addNotification(notification);
						io.to(req.params.resourceSlug).emit('notification', notification);
						if (!isActive) {
							// Delete the new broken function
							functionProvider.deleteFunction(functionId);
							log('Deleting new broken functionId %s', functionId);
						}
						if (isActive && existingTool?.functionId) {
							//Delete the old function with old functionid
							log('Deleting function with old functionId %s', functionId);
							functionProvider.deleteFunction(existingTool.functionId);
						}
					})
					.catch(e => {
						log('An error occurred while async deplopying function %s, %O', functionId, e);
					});
			});
	} catch (e) {
		console.error(e);
		// logging warnings only
		functionProvider.deleteFunction(functionId).catch(e => console.warn(e));
		editTool(req.params.resourceSlug, existingRevision.toolId, { state: ToolState.ERROR }).catch(
			e => console.warn(e)
		);
		return dynamicResponse(req, res, 400, { error: 'Error deploying or testing function' });
	}

	return dynamicResponse(req, res, 200, {});
}

/**
 * @api {delete} /forms/tool/[toolId] Delete a tool
 * @apiName delete
 * @apiGroup Tool
 *
 * @apiParam {String} toolID tool id
 */
export async function deleteToolApi(req, res, next) {
	const log = debug('webapp:controllers:tool:delete');
	log('Starting tool deletion for toolId: %s', req.body.toolId);

	let validationError = chainValidations(
		req.body,
		[{ field: 'toolId', validation: { notEmpty: true, ofType: 'string', lengthMin: 24 } }],
		{ toolId: 'Tool ID' }
	);

	if (validationError) {
		log('Validation error: %O', validationError);
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { toolId } = req.body;
	log('Fetching existing tool with id: %s', toolId);

	const existingTool: Tool = await getToolById(req.params.resourceSlug, toolId);

	if (!existingTool) {
		log('Tool not found: %s', toolId);
		return dynamicResponse(req, res, 404, { error: 'Tool not found' });
	}

	log('Found tool: %s (type: %s)', existingTool.name, existingTool.type);

	if (existingTool.type === ToolType.FUNCTION_TOOL) {
		log('Deleting function tool with functionId: %s', existingTool.functionId);
		const functionProvider = FunctionProviderFactory.getFunctionProvider();
		try {
			await functionProvider.deleteFunction(existingTool?.functionId);
			log('Successfully deleted function');
		} catch (e) {
			log('Error deleting function: %O', e);
			if (e.code !== 5) {
				return dynamicResponse(req, res, 400, {
					error: 'Failed to update tool'
				});
			}
		}
	} else if (existingTool.type === ToolType.RAG_TOOL) {
		if (existingTool.datasourceId) {
			log(
				'Checking RAG tool datasource dependencies for datasourceId: %s',
				existingTool.datasourceId
			);
			const existingToolsForDatasource: Tool[] = await getToolsForDatasource(
				req.params.resourceSlug,
				existingTool?.datasourceId
			);
			log('Found %d tools for datasource', existingToolsForDatasource?.length);
			if (existingToolsForDatasource && existingToolsForDatasource.length === 1) {
				log('Cannot delete - datasource requires at least one tool');
				return dynamicResponse(req, res, 409, {
					error:
						'This tool cannot be deleted as datasources require at least one tool associated with them. Please create another tool for this datasource if you would like to delete this tool.'
				});
			}
		}
	}

	log('Deleting tool from database');
	const oldTool = await deleteToolByIdReturnTool(req.params.resourceSlug, toolId);
	if (oldTool?.icon?.id) {
		log('Deleting tool icon asset: %s', oldTool.icon.id);
		deleteAssetById(oldTool.icon.id);
	}

	log('Cleaning up tool dependencies');
	await Promise.all([
		removeAgentsTool(req.params.resourceSlug, toolId),
		deleteRevisionsForTool(req.params.resourceSlug, toolId)
	]);

	log('Tool deletion completed successfully');
	return dynamicResponse(req, res, 200, {
		/*redirect: `/${req.params.resourceSlug}/agents`*/
	});
}

export async function deleteToolRevisionApi(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[{ field: 'revisionId', validation: { notEmpty: true, ofType: 'string', lengthMin: 24 } }],
		{ revisionId: 'Revision ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { revisionId /*, toolId*/ } = req.params;

	//TODO: anything with the tool??

	await deleteToolRevisionById(req.params.resourceSlug, revisionId);

	return dynamicResponse(req, res, 200, {
		/*redirect: `/${req.params.resourceSlug}/agents`*/
	});
}
function editTupdateToolGetOldToolool(
	resourceSlug: any,
	toolId: any,
	arg2: {
		state?: ToolState;
		name: any;
		type: ToolType;
		description: any;
		schema: any;
		datasourceId: ObjectId;
		retriever_type: any;
		retriever_config: any; //TODO: validation
		data: any;
		parameters: any;
	}
) {
	throw new Error('Function not implemented.');
}
