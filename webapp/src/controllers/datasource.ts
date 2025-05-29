'use strict';

import { dynamicResponse } from '@dr';
import { Pinecone } from '@pinecone-database/pinecone';
import { QdrantClient } from '@qdrant/js-client-rest';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getConnectors, { getConnectorSpecification } from 'airbyte/getconnectors';
import getAirbyteInternalApi from 'airbyte/internal';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
	addDatasource,
	deleteDatasourceById,
	editDatasource,
	getDatasourceById,
	getDatasourcesByTeam,
	setDatasourceConnectionSettings,
	setDatasourceEmbedding,
	setDatasourceStatus
} from 'db/datasource';
import { getModelById, getModelsByTeam } from 'db/model';
import { addTool, deleteToolsForDatasource, editToolsForDatasource } from 'db/tool';
import { getVectorDbById, getVectorDbsByTeam } from 'db/vectordb';
import debug from 'debug';
import dotenv from 'dotenv';
import { convertCronToQuartz, convertUnitToCron } from 'lib/airbyte/cronconverter';
import { chainValidations } from 'lib/utils/validationutils';
import VectorDBProxyClient from 'lib/vectorproxy/client';
import { isVectorLimitReached } from 'lib/vectorproxy/limit';
import getFileFormat from 'misc/getfileformat';
import toObjectId from 'misc/toobjectid';
import toSnakeCase from 'misc/tosnakecase';
import { ObjectId } from 'mongodb';
import path from 'path';
import MessageQueueProviderFactory from 'queue/index';
import StorageProviderFactory from 'storage/index';
import { pricingMatrix } from 'struct/billing';
import {
	DatasourceScheduleType,
	DatasourceStatus,
	getMetadataFieldInfo,
	StreamConfig,
	StreamConfigMap,
	UnstructuredChunkingStrategySet,
	UnstructuredPartitioningStrategySet
} from 'struct/datasource';
import { Retriever, ToolType } from 'struct/tool';
import { CloudRegionMap } from 'struct/vectorproxy';
import formatSize from 'utils/formatsize';

const log = debug('webapp:controllers:datasource');
const ajv = new Ajv({ strict: 'log' });
addFormats(ajv);
dotenv.config({ path: '.env' });

export async function datasourcesData(req, res, _next) {
	const [datasources, models, vectorDbs] = await Promise.all([
		getDatasourcesByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
		getVectorDbsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		datasources,
		models,
		vectorDbs
	};
}

export type DatasourcesDataReturnType = Awaited<ReturnType<typeof datasourcesData>>;

/**
 * GET /[resourceSlug]/datasources
 * datasource page html
 */
export async function datasourcesPage(app, req, res, next) {
	const data = await datasourcesData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/datasources`);
}

export async function connectionsPage(app, req, res, next) {
	const data = await datasourceData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/connections`);
}

/**
 * GET /[resourceSlug]/datasources.json
 * team datasources json data
 */
export async function datasourcesJson(req, res, next) {
	const data = await datasourcesData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export type DatasourceDataReturnType = Awaited<ReturnType<typeof datasourceData>>;

export async function datasourceData(req, res, _next) {
	const [datasource, models, vectorDbs] = await Promise.all([
		getDatasourceById(req.params.resourceSlug, req.params.datasourceId),
		getModelsByTeam(req.params.resourceSlug),
		getVectorDbsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		datasource,
		models,
		vectorDbs
	};
}

/**
 * GET /[resourceSlug]/datasource/:datasourceId.json
 * datasource json data
 */
export async function datasourceJson(req, res, next) {
	const data = await datasourceData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/datasource/:datasourceId/edit
 * datasource json data
 */
export async function datasourceEditPage(app, req, res, next) {
	const data = await datasourceData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/datasource/${data.datasource._id}/edit`);
}

/**
 * GET /[resourceSlug]/datasource/add
 * datasource json data
 */
export async function datasourceAddPage(app, req, res, next) {
	const data = await datasourceData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/datasource/add`);
}

export async function testDatasourceApi(req, res, next) {
	const { connectorId, datasourceName, datasourceDescription, sourceConfig, timeUnit } = req.body;

	const currentPlan = res.locals?.subscription?.stripePlan;
	const allowedPeriods = pricingMatrix[currentPlan]?.cronProps?.allowedPeriods || [];

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'connectorId', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'datasourceName', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'datasourceDescription', validation: { notEmpty: true, ofType: 'string' } }
		],
		{
			datasourceName: 'Name',
			datasourceDescription: 'Description',
			connectorId: 'Connector ID'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (!sourceConfig || Object.keys(sourceConfig).length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const connector = (await getConnectorSpecification(connectorId)) as any;

	const connectorList = await getConnectors();
	const submittedConnector = connectorList.find(c => c.definitionId === connectorId);
	if (!connector) {
		return dynamicResponse(req, res, 400, { error: 'Invalid source' });
	}

	if (
		res.locals.limits.allowedConnectors.length > 0 &&
		!res.locals.limits.allowedConnectors.includes(connectorId)
	) {
		return dynamicResponse(req, res, 400, {
			error: 'You need to upgrade to access 260+ data connections.'
		});
	}

	const newDatasourceId = new ObjectId();
	const spec = connector.schema.connectionSpecification;

	// https://json-shcema.org/draft-07/schema# fails to validate
	spec.$schema = 'http://json-schema.org/draft-07/schema#';

	try {
		log('spec', JSON.stringify(spec, null, 2));
		const validate = ajv.compile(spec);
		log('validate', validate);
		const validated = validate(req.body.sourceConfig);
		if (
			validate?.errors?.filter(
				p => p?.params?.pattern !== '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
			)?.length > 0
		) {
			log('validate.errors', validate?.errors);
			const error = validate.errors
				.map(error => `Invalid input for ${error.instancePath.replace('/', '')}: ${error.message}`)
				.join('; ');
			return dynamicResponse(req, res, 400, { error });
		}
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create source in airbyte based on the validated form
	let createdSource;
	const sourceType =
		submittedConnector?.githubIssueLabel_oss?.replace('source-', '') ||
		submittedConnector?.sourceType_oss;
	try {
		const sourcesApi = await getAirbyteApi(AirbyteApiType.SOURCES);
		const sourceBody = {
			configuration: {
				//NOTE: sourceType_oss is "file" (which is incorrect) for e.g. for google sheets, so we use a workaround.
				sourceType,
				...req.body.sourceConfig
			},
			workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
			name: `${datasourceName} (${newDatasourceId.toString()}) - ${res.locals.account.name} (${res.locals.account._id})`
		};
		log('sourceBody', sourceBody);
		createdSource = await sourcesApi.createSource(null, sourceBody).then(res => res.data);
		log('createdSource', createdSource);
	} catch (e) {
		log(e);
		return dynamicResponse(req, res, 400, {
			error: `Failed to create datasource: ${e?.response?.data?.detail || e}`
		});
	}

	// Test connection to the source
	let internalApi;
	try {
		internalApi = await getAirbyteInternalApi();
		const checkConnectionBody = {
			sourceId: createdSource.sourceId
		};
		log('checkConnectionBody', checkConnectionBody);
		const connectionTest = await internalApi
			.checkConnectionToSource(null, checkConnectionBody)
			.then(res => res.data);
		log('connectionTest', connectionTest);
		if (connectionTest?.status === 'failed') {
			return dynamicResponse(req, res, 400, {
				error: `Datasource connection test failed: ${connectionTest.message}`
			});
		}
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, {
			error: `Datasource connection test failed: ${e?.response?.data?.detail || e}`
		});
	}

	// Discover the schema
	let discoveredSchema;
	try {
		const discoverSchemaBody = {
			sourceId: createdSource.sourceId,
			disable_cache: true
		};
		log('discoverSchemaBody', discoverSchemaBody);
		discoveredSchema = await internalApi
			.discoverSchemaForSource(null, discoverSchemaBody)
			.then(res => res.data);
		log('discoveredSchema', JSON.stringify(discoveredSchema, null, 2));

		if (!discoveredSchema.catalog) {
			return dynamicResponse(req, res, 400, { error: 'Schema catalog not found' });
		}
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, {
			error: `Failed to discover datasource schema: ${e?.response?.data?.detail || e}`
		});
	}

	// Get stream properties to get correct sync modes from airbyte
	let streamProperties;
	try {
		const streamsApi = await getAirbyteApi(AirbyteApiType.STREAMS);
		const streamPropertiesBody = {
			sourceId: createdSource.sourceId,
			destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID
		};
		log('streamPropertiesBody', streamPropertiesBody);
		streamProperties = await streamsApi
			.getStreamProperties(streamPropertiesBody)
			.then(res => res.data);
		log('streamProperties', JSON.stringify(streamProperties, null, 2));
		if (!streamProperties) {
			return dynamicResponse(req, res, 400, { error: 'Stream properties not found' });
		}
	} catch (e) {
		log(e);
		return dynamicResponse(req, res, 400, {
			error: `Failed to discover datasource schema: ${e?.response?.data?.detail || e}`
		});
	}

	// Create the actual datasource in the db
	const createdDatasource = await addDatasource({
		_id: newDatasourceId,
		orgId: toObjectId(res.locals.matchingOrg.id),
		teamId: toObjectId(req.params.resourceSlug),
		name: datasourceName,
		description: datasourceDescription,
		filename: null,
		originalName: datasourceName,
		sourceId: createdSource.sourceId,
		connectionId: null, // no connection at this point, that comes after schema check and selecting streams
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID,
		sourceType,
		workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
		lastSyncedDate: null,
		discoveredSchema,
		createdDate: new Date(),
		status: DatasourceStatus.DRAFT,
		recordCount: { total: 0 }
	});

	return dynamicResponse(req, res, 200, {
		sourceId: createdSource.sourceId,
		discoveredSchema,
		streamProperties,
		datasourceId: createdDatasource.insertedId
	});
}

export async function addDatasourceApi(req, res, next) {
	const {
		datasourceId,
		datasourceName,
		datasourceDescription,
		scheduleType,
		cronExpression,
		modelId,
		embeddingField,
		retriever,
		streamConfig,
		retriever_config,
		timeUnit,
		chunkingConfig,
		enableConnectorChunking,
		vectorDbId,
		byoVectorDb,
		collectionName,
		noRedirect,
		region,
		cloud
	} = req.body;

	const collection = collectionName || datasourceId;

	const currentPlan = res.locals?.subscription?.stripePlan;
	const allowedPeriods = pricingMatrix[currentPlan]?.cronProps?.allowedPeriods || [];

	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'retriever',
				validation: { notEmpty: true, inSet: new Set(Object.values(Retriever)) }
			},
			{ field: 'modelId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } },
			{ field: 'embeddingField', validation: { ofType: 'string' } },
			{ field: 'datasourceId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } },
			{ field: 'datasourceName', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'datasourceDescription', validation: { notEmpty: true, ofType: 'string' } },
			{
				field: 'scheduleType',
				validation: { notEmpty: true, inSet: new Set(Object.values(DatasourceScheduleType)) }
			},
			{ field: 'timeUnit', validation: { inSet: new Set(allowedPeriods) } }
			//TODO: validation for retriever_config and streams?
		],
		{
			datasourceName: 'Name',
			datasourceDescription: 'Description',
			connectorId: 'Connector ID',
			modelId: 'Embedding Model'
		}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (!byoVectorDb && (!region || region === '')) {
		return dynamicResponse(req, res, 400, { error: 'Region is required' });
	}

	const limitReached = await isVectorLimitReached(
		req.params.resourceSlug,
		res.locals?.subscription?.stripePlan
	);
	if (limitReached) {
		return dynamicResponse(req, res, 400, { error: 'Vector storage limit reached' });
	}

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (!datasource.discoveredSchema.catalog) {
		return dynamicResponse(req, res, 400, { error: 'Schema catalog not found' });
	}

	const model = await getModelById(req.params.resourceSlug, modelId);
	if (!model) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const connectionBody = {
		name: datasource._id.toString(),
		sourceId: datasource.sourceId,
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID,
		configurations: {
			streams: Object.entries(streamConfig).map((e: [string, StreamConfig]) => {
				const streamData = e[1][1];
				return {
					name: e[1][0],
					syncMode: streamData.syncMode,
					cursorField: streamData.cursorField?.length > 0 ? streamData.cursorField : null,
					primaryKey: streamData.primaryKey?.length > 0 ? streamData.primaryKey.map(x => [x]) : null
				};
			})
		},
		dataResidency: 'auto',
		namespaceDefinition: 'destination',
		// namespaceFormat: null,
		prefix: `${datasource._id.toString()}_`,
		nonBreakingSchemaUpdatesBehavior: 'ignore',
		status: 'active'
	};
	if (scheduleType === DatasourceScheduleType.CRON) {
		connectionBody['schedule'] = {
			scheduleType: DatasourceScheduleType.CRON,
			//cronExpression: convertCronToQuartz(cronExpression) //Airbyte uses a special snowflake cron syntax and this mostly works.
			cronExpression: convertUnitToCron(timeUnit)
		};
	} else {
		connectionBody['schedule'] = {
			scheduleType: DatasourceScheduleType.MANUAL
		};
	}
	const createdConnection = await connectionsApi
		.createConnection(null, connectionBody)
		.then(res => res.data);

	const {
		partitioning,
		strategy,
		max_characters,
		new_after_n_chars,
		similarity_threshold,
		overlap,
		overlap_all,
		file_type
	} = chunkingConfig || {};

	// Update the datasource with the connection settings and sync date
	await editDatasource(req.params.resourceSlug, datasourceId, {
		connectionId: createdConnection.connectionId,
		connectionSettings: connectionBody,
		modelId: toObjectId(modelId),
		embeddingField,
		streamConfig, //TODO: validation
		lastSyncedDate: new Date(),
		chunkingConfig: enableConnectorChunking
			? {
					partitioning,
					strategy,
					max_characters: parseInt(max_characters),
					new_after_n_chars: new_after_n_chars
						? parseInt(new_after_n_chars)
						: parseInt(max_characters),
					overlap: parseInt(overlap),
					similarity_threshold: parseFloat(similarity_threshold),
					overlap_all: overlap_all === 'true',
					file_type
				}
			: null, //TODO: validation
		vectorDbId: toObjectId(vectorDbId),
		byoVectorDb,
		region,
		cloud,
		collectionName: collection,
		namespace: datasourceId
	});

	try {
		await VectorDBProxyClient.createCollection(datasourceId, {
			cloud,
			region,
			collection_name: collectionName,
			index_name: collectionName
		});
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, {
			error: 'Failed to create collection in vector database, please try again later.'
		});
	}

	// Create a job to trigger the connection to sync
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const jobBody = {
		connectionId: createdConnection.connectionId,
		jobType: 'sync'
	};
	const createdJob = await jobsApi.createJob(null, jobBody).then(res => res.data);
	log('createdJob', createdJob);

	// Set status to processing after jub submission
	await setDatasourceStatus(req.params.resourceSlug, datasourceId, DatasourceStatus.PROCESSING);

	//TODO: on any failures, revert the airbyte api calls like a transaction

	/* TODO: fix this. for now we always set the metadata_field_info as copied from the datasource */
	let metadata_field_info = [];
	if (datasource) {
		try {
			metadata_field_info = getMetadataFieldInfo(datasource?.streamConfig);
		} catch (e) {
			log(e);
			//supress
		}
	}

	// Add a tool automatically for the datasource
	let foundIcon; //TODO: icon/avatar id and upload
	const addedTool = await addTool({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: datasourceName,
		description: datasourceDescription,
		type: ToolType.RAG_TOOL,
		datasourceId: toObjectId(datasourceId),
		schema: null,
		retriever_type: retriever || null,
		retriever_config: { ...retriever_config, metadata_field_info }, //TODO: validation
		data: {
			builtin: false,
			name: toSnakeCase(datasourceName)
		},
		icon: foundIcon
			? {
					id: foundIcon._id,
					filename: foundIcon.filename
				}
			: null
	});
	if (noRedirect) {
		return dynamicResponse(req, res, 200, {
			toolId: addedTool.insertedId
		});
	}

	return dynamicResponse(req, res, 302, {
		redirect: `/${req.params.resourceSlug}/datasources`,
		toolId: addedTool.insertedId
	});
}

export async function updateDatasourceScheduleApi(req, res, next) {
	const { datasourceId, scheduleType, cronExpression, timeUnit } = req.body;

	const currentPlan = res.locals?.subscription?.stripePlan;
	const allowedPeriods = pricingMatrix[currentPlan]?.cronProps?.allowedPeriods || [];
	let validationError = chainValidations(
		req.body,
		[{ field: 'timeUnit', validation: { inSet: new Set(allowedPeriods) } }],
		{}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (!datasourceId || typeof datasourceId !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//TODO: validation for other fields

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create a connection to our destination in airbyte
	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const connectionBody = {
		...datasource.connectionSettings,
		scheduleType: scheduleType as DatasourceScheduleType
	};
	connectionBody['connectionId'] = datasource.connectionId;

	if (scheduleType === DatasourceScheduleType.CRON) {
		connectionBody['schedule'] = {
			scheduleType: DatasourceScheduleType.CRON,
			//cronExpression: convertCronToQuartz(cronExpression)
			cronExpression: convertUnitToCron(timeUnit)
		};
	} else {
		connectionBody['schedule'] = {
			scheduleType: DatasourceScheduleType.MANUAL
		};
	}
	log('connectionBody', JSON.stringify(connectionBody, null, 2));
	try {
		const updatedConnection = await connectionsApi
			.patchConnection(datasource.connectionId, connectionBody)
			.then(res => res.data);
		log('updatedConnection', updatedConnection);
	} catch (e) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Update the datasource with the connection settings
	await editDatasource(req.params.resourceSlug, datasourceId, {
		connectionId: datasource.connectionId,
		connectionSettings: connectionBody,
		timeUnit: timeUnit
	});

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 200, {});
}

export async function updateDatasourceStreamsApi(req, res, next) {
	const {
		datasourceId,
		sync,
		streamConfig
	}: {
		datasourceId: ObjectId;
		sync: Boolean;
		streamConfig: StreamConfigMap;
	} = req.body;

	const currentPlan = res.locals?.subscription?.stripePlan;
	const allowedPeriods = pricingMatrix[currentPlan]?.cronProps?.allowedPeriods || [];

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'datasourceId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }
			//TODO: validation for StreamConfig type
		],
		{}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);
	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//update the metadata map of tools if found
	//TODO: move these fields to be stored on tools and fetch the schema on frontend with the tools datasource ID
	//NOTE: combines for all streams, may cause conflicts, needs BIG discussion how to overhaul for multi-stream support
	let metadataFieldInfo = [];
	try {
		metadataFieldInfo = getMetadataFieldInfo(streamConfig);
	} catch (e) {
		log(e);
		//suppressed
	}

	await editToolsForDatasource(req.params.resourceSlug, datasourceId, {
		'retriever_config.metadata_field_info': metadataFieldInfo
	});

	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const connectionBody = {
		name: datasource._id.toString(),
		sourceId: datasource.sourceId,
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID,
		configurations: {
			streams: Object.entries(streamConfig).map((e: [string, StreamConfig]) => {
				const streamData = e[1][1];
				return {
					name: e[1][0],
					syncMode: streamData.syncMode,
					cursorField: streamData.cursorField?.length > 0 ? streamData.cursorField : null,
					primaryKey: streamData.primaryKey?.length > 0 ? streamData.primaryKey.map(x => [x]) : null
				};
			})
		},
		dataResidency: 'auto',
		namespaceDefinition: 'destination',
		// namespaceFormat: null,
		prefix: `${datasource._id.toString()}_`,
		nonBreakingSchemaUpdatesBehavior: 'ignore',
		status: 'active'
	};

	if (datasource?.connectionSettings?.schedule?.scheduleType === DatasourceScheduleType.CRON) {
		connectionBody['schedule'] = {
			scheduleType: DatasourceScheduleType.CRON,
			//cronExpression: convertCronToQuartz(cronExpression)
			cronExpression: convertUnitToCron(datasource.timeUnit)
		};
	} else {
		connectionBody['schedule'] = {
			scheduleType: DatasourceScheduleType.MANUAL
		};
	}

	try {
		const createdConnection = await connectionsApi
			.patchConnection(datasource.connectionId, connectionBody)
			.then(res => res.data);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, {
			error: 'An error occurred when trying to update the datasource.'
		});
	}

	if (sync === true) {
		// Create the collection in qdrant
		try {
			await VectorDBProxyClient.createCollection(datasourceId);
		} catch (e) {
			console.error(e);
			return dynamicResponse(req, res, 400, {
				error: 'Failed to create collection in vector database, please try again later.'
			});
		}
		// Create a job to trigger the connection to sync
		const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
		const jobBody = {
			connectionId: datasource.connectionId,
			jobType: 'sync'
		};
		const createdJob = await jobsApi.createJob(null, jobBody).then(res => res.data);
		log('createdJob', createdJob);
	}

	// Update the datasource with the connection settings and sync date
	await editDatasource(req.params.resourceSlug, datasourceId, {
		connectionId: datasource.connectionId,
		connectionSettings: connectionBody,
		streamConfig,
		...(sync ? { recordCount: { total: 0 } } : {})
	});

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 200, {});
}

export async function syncDatasourceApi(req, res, next) {
	const { datasourceId } = req.params;
	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);
	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const limitReached = await isVectorLimitReached(
		req.params.resourceSlug,
		res.locals?.subscription?.stripePlan
	);
	if (limitReached) {
		return dynamicResponse(req, res, 400, { error: 'Vector storage limit reached' });
	}

	// Create the collection in qdrant
	try {
		await VectorDBProxyClient.createCollection(datasourceId);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, {
			error: 'Failed to create collection in vector database, please try again later.'
		});
	}

	if (datasource?.sourceType === 'file') {
		// Fetch the appropriate message queue provider
		const messageQueueProvider = MessageQueueProviderFactory.getMessageQueueProvider();

		// Prepare the message and metadata
		const message = JSON.stringify({
			bucket: process.env.NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE,
			filename: datasource?.filename,
			file: `/tmp/${datasource?.filename}`
		});
		const metadata = {
			_stream: datasource._id.toString(),
			stream: datasource._id.toString(),
			type: process.env.NEXT_PUBLIC_STORAGE_PROVIDER
		};

		// Send the message using the provider
		await messageQueueProvider.sendMessage(message, metadata);

		await editDatasource(req.params.resourceSlug, datasourceId, {
			recordCount: { total: 0, success: 0, failure: 0 },
			status: DatasourceStatus.EMBEDDING
		});
	} else {
		// Create a job to trigger the connection to sync
		const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
		const jobBody = {
			connectionId: datasource.connectionId,
			jobType: 'sync'
		};

		try {
			const createdJob = await jobsApi.createJob(null, jobBody).then(res => res.data);
			log('createdJob', createdJob);
		} catch (e) {
			log(e);
			return dynamicResponse(req, res, 400, { error: 'Error submitting sync job' });
		}

		//Note: edited after job submission to avoid being stuck PROCESSING if airbyte returns an error
		await editDatasource(req.params.resourceSlug, datasourceId, {
			recordCount: { total: 0, success: 0, failure: 0 },
			status: DatasourceStatus.PROCESSING
		});
	}

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 200, {});
}

/**
 * @api {delete} /forms/datasource/[datasourceId] Delete a datasource
 * @apiName delete
 * @apiGroup Datasource
 *
 * @apiParam {String} datasourceID datasource id
 */
export async function deleteDatasourceApi(req, res, next) {
	const { datasourceId } = req.params;
	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);
	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Run a reset job in airbyte
	if (datasource.connectionId) {
		try {
			const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
			const jobBody = {
				connectionId: datasource.connectionId,
				jobType: 'reset'
			};
			const resetJob = await jobsApi.createJob(null, jobBody).then(res => res.data);
			log('resetJob', resetJob);
		} catch (e) {
			// Continue but log a warning if the reset job api call fails
			console.warn(e);
		}

		// Delete the connection in airbyte
		const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
		const connectionBody = {
			connectionId: datasource.connectionId
		};
		try {
			const deletedConnection = await connectionsApi
				.deleteConnection(connectionBody, connectionBody)
				.then(res => res.data);
		} catch (e) {
			console.warn(e);
		}
	}

	// Delete the source file in GCS if this is a file
	if (datasource.sourceType === 'file') {
		try {
			const storageProvider = StorageProviderFactory.getStorageProvider();
			await storageProvider.deleteFile(datasource.filename);
		} catch (err) {
			//Ignoring when gcs file doesn't exist or was already deleted
			if (!Array.isArray(err?.errors) || err.errors[0]?.reason !== 'notFound') {
				log(err);
				return dynamicResponse(req, res, 400, { error: 'Error deleting datasource' });
			}
		}
	} else {
		// Delete the source in airbyte
		const sourcesApi = await getAirbyteApi(AirbyteApiType.SOURCES);
		const sourceBody = {
			sourceId: datasource.sourceId
		};
		try {
			const deletedSource = await sourcesApi
				.deleteSource(sourceBody, sourceBody)
				.then(res => res.data);
		} catch (e) {
			log(e);
			if (e?.response?.data?.title !== 'resource-not-found') {
				return dynamicResponse(req, res, 400, { error: 'Error deleting datasource' });
			}
		}
	}

	// Delete the points in qdrant
	try {
		await VectorDBProxyClient.deleteCollection(req.params.datasourceId);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, {
			error: 'Failed to delete points from vector database, please try again later.'
		});
	}

	// Delete the datasourcein the db
	await Promise.all([
		deleteDatasourceById(req.params.resourceSlug, datasourceId),
		deleteToolsForDatasource(req.params.resourceSlug, datasourceId)
	]);

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 200, {
		/**/
	});
}

export async function uploadFileApi(req, res, next) {
	if (!req.files || Object.keys(req.files).length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Missing file' });
	}

	const {
		modelId,
		name,
		datasourceDescription,
		retriever,
		retriever_config,
		partitioning,
		strategy,
		max_characters,
		new_after_n_chars,
		overlap,
		similarity_threshold,
		overlap_all
	} = req.body;

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'modelId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } },
			{ field: 'datasourceDescription', validation: { notEmpty: true, ofType: 'string' } },
			{
				field: 'retriever',
				validation: { notEmpty: true, inSet: new Set(Object.values(Retriever)) }
			},
			{
				field: 'partitioning',
				validation: { notEmpty: true, inSet: UnstructuredPartitioningStrategySet }
			},
			{ field: 'strategy', validation: { notEmpty: true, inSet: UnstructuredChunkingStrategySet } },
			{ field: 'max_characters', validation: { notEmpty: true } },
			{ field: 'overlap', validation: { notEmpty: true } },
			{ field: 'similarity_threshold', validation: { notEmpty: true } },
			{ field: 'overlap_all', validation: { notEmpty: true } }
		],
		{
			datasourceName: 'Name',
			datasourceDescription: 'Description',
			connectorId: 'Connector ID',
			modelId: 'Embedding Model',
			partitioning: 'Partitioning Strategy',
			strategy: 'Chunk Strategy',
			max_characters: 'Max Characters',
			new_after_n_chars: 'New After N Characters',
			overlap: 'Overlap',
			similarity_threshold: 'Similarity Threshold',
			overlap_all: 'Overlap All'
		}
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const validMetadata = (req.body?.retriever_config?.metadata_field_info || []).every(obj => {
		return (
			typeof obj?.name === 'string' &&
			typeof obj?.description === 'string' &&
			['string', 'integer', 'float'].includes(obj?.type)
		);
	});
	if (!validMetadata) {
		return dynamicResponse(req, res, 400, { error: 'Invalid stream metadata' });
	}
	if (retriever_config) {
		let validationErrorRetrieverConfig = chainValidations(
			retriever_config,
			[
				{
					field: 'decay_rate',
					validation: { notEmpty: retriever === Retriever.TIME_WEIGHTED, numberFromInclusive: 0 }
				}
				//Note: topk unused currently
			],
			{ decay_rate: 'Decay Rate' }
		);

		if (validationErrorRetrieverConfig) {
			return dynamicResponse(req, res, 400, { error: validationErrorRetrieverConfig });
		}
	}

	const uploadedFile = req.files.file;
	let fileExtension = path.extname(uploadedFile.name);
	const fileFormat = getFileFormat(fileExtension);
	if (!fileFormat) {
		return dynamicResponse(req, res, 400, { error: 'Invalid file format' });
	}

	const currentPlan = res.locals?.subscription?.stripePlan;
	if (uploadedFile?.size > pricingMatrix[currentPlan].maxFileUploadBytes) {
		return dynamicResponse(req, res, 400, {
			error: `Uploaded file exceeds maximum size for your plan "${currentPlan}" (${formatSize(uploadedFile.size)})`
		});
	}

	const limitReached = await isVectorLimitReached(
		req.params.resourceSlug,
		res.locals?.subscription?.stripePlan
	);
	if (limitReached) {
		return dynamicResponse(req, res, 400, { error: 'Vector storage limit reached' });
	}

	const model = await getModelById(req.params.resourceSlug, modelId);
	if (!model) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (retriever && !Object.values(Retriever).includes(retriever)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid Retrieval Strategy' });
	}

	// Create the datasource in the db
	const newDatasourceId = new ObjectId();
	const filename = `${newDatasourceId.toString()}${fileExtension}`;
	const createdDatasource = await addDatasource({
		_id: newDatasourceId,
		orgId: toObjectId(res.locals.matchingOrg.id),
		teamId: toObjectId(req.params.resourceSlug),
		name: name,
		filename: filename,
		description: datasourceDescription,
		originalName: uploadedFile.name,
		sourceId: null,
		connectionId: null,
		destinationId: null,
		sourceType: 'file',
		workspaceId: null,
		lastSyncedDate: new Date(), //TODO: make this null and then get updated once file upload dataources have some webhook/completion feedback
		modelId: toObjectId(modelId),
		createdDate: new Date(),
		embeddingField: 'document', //Note: always document for sourceType: file
		status: DatasourceStatus.EMBEDDING,
		recordCount: {
			total: 0
		},
		chunkingConfig: {
			partitioning,
			strategy,
			max_characters: parseInt(max_characters),
			new_after_n_chars: new_after_n_chars ? parseInt(new_after_n_chars) : parseInt(max_characters),
			overlap: parseInt(overlap),
			similarity_threshold: parseFloat(similarity_threshold),
			overlap_all: overlap_all === 'true'
		}
	});

	// Send the gcs file path to rabbitmq
	const storageProvider = StorageProviderFactory.getStorageProvider();
	await storageProvider.uploadLocalFile(filename, uploadedFile, uploadedFile.mimetype);

	// Create the collection in qdrant
	try {
		await VectorDBProxyClient.createCollection(newDatasourceId);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, {
			error: 'Failed to create collection in vector database, please try again later.'
		});
	}

	// Fetch the appropriate message queue provider
	const messageQueueProvider = MessageQueueProviderFactory.getMessageQueueProvider();

	// Prepare the message and metadata
	const message = JSON.stringify({
		bucket: process.env.NEXT_PUBLIC_GCS_BUCKET_NAME_PRIVATE,
		filename,
		file: `/tmp/${filename}`
	});
	const metadata = {
		_stream: newDatasourceId.toString(),
		stream: newDatasourceId.toString(),
		type: process.env.NEXT_PUBLIC_STORAGE_PROVIDER
	};

	// Send the message using the provider
	await messageQueueProvider.sendMessage(message, metadata);

	//TODO: on any failures, revert the airbyte api calls like a transaction

	// Add a tool automatically for the datasource
	let foundIcon; //TODO: icon/avatar id and upload
	await addTool({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: name,
		description: datasourceDescription,
		type: ToolType.RAG_TOOL,
		datasourceId: toObjectId(newDatasourceId),
		schema: null,
		retriever_type: retriever || null,
		retriever_config: retriever_config || {}, //TODO
		data: {
			builtin: false,
			name: toSnakeCase(name)
		},
		icon: foundIcon
			? {
					id: foundIcon._id,
					filename: foundIcon.filename
				}
			: null
	});

	return dynamicResponse(req, res, 302, {
		datasourceId: createdDatasource.insertedId,
		name
	});
}
