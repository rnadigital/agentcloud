'use strict';

import { dynamicResponse } from '@dr';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getConnectors from 'airbyte/getconnectors';
import getAirbyteInternalApi from 'airbyte/internal';
import Ajv from 'ajv';
import { getModelById, getModelsByTeam } from 'db/model';
import { addTool } from 'db/tool';
import debug from 'debug';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { sendMessage } from 'lib/rabbitmq/send';
import convertStringToJsonl from 'misc/converttojsonl';
import getFileFormat from 'misc/getfileformat';
import toObjectId from 'misc/toobjectid';
import toSnakeCase from 'misc/tosnakecase';
import { ObjectId } from 'mongodb';
import path from 'path';
import { PDFExtract } from 'pdf.js-extract';
import StorageProviderFactory from 'storage/index';
import { DatasourceStatus } from 'struct/datasource';
import { DatasourceScheduleType } from 'struct/schedule';
import { ToolType } from 'struct/tool';
import { promisify } from 'util';
import VectorDBProxy from 'vectordb/proxy';
const log = debug('webapp:controllers:datasource');

import { addDatasource, deleteDatasourceById, editDatasource, getDatasourceById, getDatasourcesByTeam, setDatasourceConnectionSettings, setDatasourceEmbedding, setDatasourceLastSynced,setDatasourceStatus } from '../db/datasource';
const ajv = new Ajv({ strict: 'log' });
function validateDateTimeFormat(dateTimeStr) {
	const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
	dateTimeStr = dateTimeStr?.replace('.000Z', 'Z');
	return dateFormatRegex.test(dateTimeStr);
}
function updateDateStrings(obj) {
	Object.keys(obj).forEach(key => {
		if (typeof obj[key] === 'object') {
			updateDateStrings(obj[key]);
		} else if (typeof obj[key] === 'string') {
			obj[key] = obj[key].replace(/\.000Z$/, 'Z');
		}
	});
}
ajv.addFormat('date-time', validateDateTimeFormat);

const pdfExtract = new PDFExtract();
const pdfExtractPromisified = promisify(pdfExtract.extractBuffer);
dotenv.config({ path: '.env' });

export async function datasourcesData(req, res, _next) {
	const [datasources, models] = await Promise.all([
		getDatasourcesByTeam(req.params.resourceSlug),
		getModelsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		datasources,
		models,
	};
}

/**
* GET /[resourceSlug]/datasources
* datasource page html
*/
export async function datasourcesPage(app, req, res, next) {
	const data = await datasourcesData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/datasources`);
}

/**
* GET /[resourceSlug]/datasources.json
* team datasources json data
*/
export async function datasourcesJson(req, res, next) {
	const data = await datasourcesData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function datasourceData(req, res, _next) {
	const [datasource, models] = await Promise.all([
		getDatasourceById(req.params.resourceSlug, req.params.datasourceId),
		getModelsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		datasource,
		models,
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

	const { connectorId, connectorName, datasourceName, datasourceDescription, sourceConfig }  = req.body;

	if (!sourceConfig || Object.keys(sourceConfig).length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const connectorList = await getConnectors();
	const submittedConnector = connectorList.find(c => c.definitionId === connectorId);
	if (!submittedConnector) {
		return dynamicResponse(req, res, 400, { error: 'Invalid source' });
	}
	const newDatasourceId = new ObjectId();
	const spec = submittedConnector.spec_oss.connectionSpecification;
	// log(JSON.stringify(spec, null, 2));
	try {
		const validate = ajv.compile(spec);
		const validated = validate(req.body.sourceConfig);
		if (validate?.errors?.filter(p => p?.params?.pattern !== '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$')?.length > 0) {
			log('validate.errors', validate?.errors);
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create source in airbyte based on the validated form
	let createdSource;
	const sourceType = submittedConnector?.githubIssueLabel_oss?.replace('source-', '') || submittedConnector?.sourceType_oss;		
	try {
		const sourcesApi = await getAirbyteApi(AirbyteApiType.SOURCES);
		updateDateStrings(req.body.sourceConfig);
		const sourceBody = {
			configuration: {
				//NOTE: sourceType_oss is "file" (which is incorrect) for e.g. for google sheets, so we use a workaround.
				sourceType,
				...req.body.sourceConfig,
			},
			workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
			name: `${datasourceName} (${newDatasourceId.toString()}) - ${res.locals.account.name} (${res.locals.account._id})`,
		};
		log('sourceBody', sourceBody);	
		createdSource = await sourcesApi
			.createSource(null, sourceBody)
			.then(res => res.data);
		log('createdSource', createdSource);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: `Failed to create datasource: ${e?.response?.data?.detail || e}` });
	}

	// Test connection to the source
	let internalApi;
	try {
		internalApi = await getAirbyteInternalApi();
		const checkConnectionBody = {
			sourceId: createdSource.sourceId,
		};
		log('checkConnectionBody', checkConnectionBody);
		const connectionTest = await internalApi
			.checkConnectionToSource(null, checkConnectionBody)
			.then(res => res.data);
		log('connectionTest', connectionTest);
		if (connectionTest?.status === 'failed') {
			return dynamicResponse(req, res, 400, { error: `Datasource connection test failed: ${connectionTest.message}` });
		}
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: `Datasource connection test failed: ${e?.response?.data?.detail || e}` });
	}

	// Discover the schema
	let discoveredSchema;
	try {
		const discoverSchemaBody = {
			sourceId: createdSource.sourceId,
		};
		log('discoverSchemaBody', discoverSchemaBody);
		discoveredSchema = await internalApi
			.discoverSchemaForSource(null, discoverSchemaBody)
			.then(res => res.data);
		log('discoveredSchema', JSON.stringify(discoveredSchema, null, 2));
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: `Failed to discover datasource schema: ${e?.response?.data?.detail || e}` });
	}

	// Create the collection in qdrant
	// try {
	// 	await VectorDBProxy.createCollectionInQdrant(newDatasourceId);
	// } catch (e) {
	// 	return dynamicResponse(req, res, 400, { error: 'Failed to create collection in vector database, please try again later.' });
	// }

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
	});

	return dynamicResponse(req, res, 200, {
		sourceId: createdSource.sourceId,
		discoveredSchema,
		datasourceId: createdDatasource.insertedId,
	});

}

export async function addDatasourceApi(req, res, next) {

	const { 
		datasourceId,
		datasourceName,
		datasourceDescription,
		streams,
		selectedFieldsMap,
		scheduleType,
		timeUnit,
		units,
		cronExpression,
		cronTimezone,
		modelId,
		name,
		embeddingField,
	}  = req.body;

	if (!datasourceId || typeof datasourceId !== 'string'
		|| !modelId || typeof modelId !== 'string'
		|| !Array.isArray(streams) || streams.some(s => typeof s !== 'string')) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//TODO: validation for other fields

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);
	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const model = await getModelById(req.params.resourceSlug, modelId);
	if (!model) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create a connection to our destination in airbyte
	const connectionsApi = await getAirbyteInternalApi();
	const schemaStreams = datasource?.discoveredSchema?.catalog?.streams;
	const connectionBody = {
		connectionId: datasource.connectionId,
		sourceId: datasource.sourceId,
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID,
		syncCatalog: {
			streams: streams.map(s => {
				const fieldSelectionEnabled = selectedFieldsMap[s] && selectedFieldsMap[s].length > 0;
				const config = {
					aliasName: s,
					syncMode: 'full_refresh',
					destinationSyncMode: 'append',
					fieldSelectionEnabled,
					selected: true,
					primaryKey: [],
					cursorField: [],
				};
				if (fieldSelectionEnabled) {
					config['selectedFields'] = selectedFieldsMap[s]
						.map(x => ({ fieldPath: [x] }));
				}
				return {
					stream: {
						name: s,
						defaultCursorField: [],
						sourceDefinedPrimaryKey: [],
						namespace: schemaStreams.find(st => st?.stream?.name === s)?.stream?.namespace,
						jsonSchema: schemaStreams.find(st => st?.stream?.name === s)?.stream?.jsonSchema,
						supportedSyncModes: ['full_refresh', 'incremental'],
					},
					config,
				};
			})
		},
		scheduleType: scheduleType,
		namespaceDefinition: 'destination',
		// namespaceFormat: null,
		prefix: `${datasource._id.toString()}_`,
		nonBreakingSchemaUpdatesBehavior: 'ignore',
		name: datasource._id.toString(),
		status: 'active',
		operations: [],
		skipReset: false,
	};
	if (scheduleType === DatasourceScheduleType.BASICSCHEDULE) {
		connectionBody['scheduleData'] = {
			basicSchedule: {
				timeUnit,
				units,
			},
		};
	} else if (scheduleType === DatasourceScheduleType.CRON) {
		connectionBody['scheduleData'] = {
			cron: {
				cronExpression,
				cronTimezone,
			},
		};
	}
	log('connectionBody', JSON.stringify(connectionBody, null, 2));
	const createdConnection = await connectionsApi
		.createConnection(null, connectionBody)
		.then(res => res.data);
	log('createdConnection', JSON.stringify(createdConnection, null, 2));

	// Update the datasource with the connection settings and sync date
	await Promise.all([
		setDatasourceConnectionSettings(req.params.resourceSlug, datasourceId, createdConnection.connectionId, connectionBody),
		// setDatasourceLastSynced(req.params.resourceSlug, datasourceId, new Date()), //NOTE: not being used, updated in webhook handler instead
		setDatasourceEmbedding(req.params.resourceSlug, datasourceId, modelId, embeddingField),
	]);

	// Create the collection in qdrant
	try {
		await VectorDBProxy.createCollectionInQdrant(datasourceId);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Failed to create collection in vector database, please try again later.' });
	}

	// Create a job to trigger the connection to sync
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const jobBody = {
		connectionId: createdConnection.connectionId,
		jobType: 'sync',
	};
	const createdJob = await jobsApi
		.createJob(null, jobBody)
		.then(res => res.data);
	log('createdJob', createdJob);

	// Set status to processing after jub submission
	await setDatasourceStatus(req.params.resourceSlug, datasourceId, DatasourceStatus.PROCESSING);
	
	//TODO: on any failures, revert the airbyte api calls like a transaction

	// Add a tool automatically for the datasource
	let foundIcon; //TODO: icon/avatar id and upload
	await addTool({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name: datasourceName,
		description: datasourceDescription,
		type: ToolType.RAG_TOOL,
		datasourceId: toObjectId(datasourceId),
		schema: null,
		data: {
			builtin: false,
			name: toSnakeCase(datasourceName),
		},
		icon: foundIcon ? {
			id: foundIcon._id,
			filename: foundIcon.filename,
		} : null,
	});

	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/datasources` });

}

export async function updateDatasourceScheduleApi(req, res, next) {

	const { 
		datasourceId,
		scheduleType,
		timeUnit,
		units,
		cronExpression,
		cronTimezone
	}  = req.body;

	if (!datasourceId || typeof datasourceId !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//TODO: validation for other fields

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create a connection to our destination in airbyte
	const connectionsApi = await getAirbyteInternalApi();
	const connectionBody = {
		...datasource.connectionSettings,
		scheduleType: scheduleType,
	};
	connectionBody['connectionId'] = datasource.connectionId;
	if (scheduleType === DatasourceScheduleType.BASICSCHEDULE) {
		connectionBody['scheduleData'] = {
			basicSchedule: {
				timeUnit,
				units,
			},
		};
	} else if (scheduleType === DatasourceScheduleType.CRON) {
		connectionBody['scheduleData'] = {
			cron: {
				cronExpression,
				cronTimezone,
			},
		};
	} else {
		delete connectionBody['scheduleData'];
	}
	log('connectionBody', JSON.stringify(connectionBody, null, 2));
	const updatedConnection = await connectionsApi
		.updateConnection(null, connectionBody)
		.then(res => res.data);
	log('updatedConnection', updatedConnection);

	// Update the datasource with the connection settings and sync date
	await Promise.all([
		setDatasourceConnectionSettings(req.params.resourceSlug, datasourceId, datasource.connectionId, connectionBody),
	]);

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 200, { });

}

export async function updateDatasourceStreamsApi(req, res, next) {

	const { 
		datasourceId,
		streams,
		sync,
		selectedFieldsMap,
		scheduleType,
		timeUnit,
		units,
		cronExpression,
		cronTimezone
	}  = req.body;

	if (!datasourceId || typeof datasourceId !== 'string'
		|| !Array.isArray(streams) || streams.some(s => typeof s !== 'string')) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//TODO: validation for other fields

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create a connection to our destination in airbyte
	const connectionsApi = await getAirbyteInternalApi();
	const schemaStreams = datasource?.discoveredSchema?.catalog?.streams;
	const connectionBody = {
		connectionId: datasource.connectionId,
		sourceId: datasource.sourceId,
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID,
		syncCatalog: {
			streams: streams.map(s => {
				const fieldSelectionEnabled = selectedFieldsMap[s] && selectedFieldsMap[s].length > 0;
				const config = {
					aliasName: s,
					syncMode: 'full_refresh',
					destinationSyncMode: 'append',
					fieldSelectionEnabled,
					selected: true,
					primaryKey: [],
					cursorField: [],
				};
				if (fieldSelectionEnabled) {
					config['selectedFields'] = selectedFieldsMap[s]
						.map(x => ({ fieldPath: [x] }));
				}
				return {
					stream: {
						name: s,
						defaultCursorField: [],
						sourceDefinedPrimaryKey: [],
						namespace: schemaStreams.find(st => st?.stream?.name === s)?.stream?.namespace,
						jsonSchema: schemaStreams.find(st => st?.stream?.name === s)?.stream?.jsonSchema,
						supportedSyncModes: ['full_refresh', 'incremental'],
					},
					config,
				};
			})
		},
		scheduleType,
		namespaceDefinition: 'destination',
		// namespaceFormat: null,
		prefix: `${datasource._id.toString()}_`,
		nonBreakingSchemaUpdatesBehavior: 'ignore',
		name: datasource._id.toString(),
		status: 'active',
		operations: [],
		skipReset: false,
	};
	if (scheduleType === DatasourceScheduleType.BASICSCHEDULE) {
		connectionBody['scheduleData'] = {
			basicSchedule: {
				timeUnit,
				units,
			},
		};
	} else if (scheduleType === DatasourceScheduleType.CRON) {
		connectionBody['scheduleData'] = {
			cron: {
				cronExpression,
				cronTimezone,
			},
		};
	}
	log('connectionBody', JSON.stringify(connectionBody, null, 2));
	let updatedConnection;
	if (connectionBody?.connectionId) {
		updatedConnection = await connectionsApi
			.updateConnection(null, connectionBody)
			.then(res => res.data);
		log('updatedConnection', updatedConnection);
	} else {
		updatedConnection = await connectionsApi
			.createConnection(null, connectionBody)
			.then(res => res.data);
		log('createdConnection', JSON.stringify(updatedConnection, null, 2));
	}

	if (sync === true) {
		// Create the collection in qdrant
		try {
			await VectorDBProxy.createCollectionInQdrant(datasourceId);
		} catch (e) {
			console.error(e);
			return dynamicResponse(req, res, 400, { error: 'Failed to create collection in vector database, please try again later.' });
		}
		// Create a job to trigger the connection to sync
		const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
		const jobBody = {
			connectionId: datasource.connectionId,
			jobType: 'sync',
		};
		const createdJob = await jobsApi
			.createJob(null, jobBody)
			.then(res => res.data);
		log('createdJob', createdJob);
	}

	// Update the datasource with the connection settings and sync date
	await Promise.all([
		setDatasourceConnectionSettings(req.params.resourceSlug, datasourceId, datasource.connectionId, connectionBody),
		// sync === true ? setDatasourceLastSynced(req.params.resourceSlug, datasourceId, new Date()) : void 0
	]);

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 200, { });

}

export async function syncDatasourceApi(req, res, next) {

	const { datasourceId } = req.params;

	if (!datasourceId || typeof datasourceId !== 'string' || datasourceId.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create the collection in qdrant
	try {
		await VectorDBProxy.createCollectionInQdrant(datasourceId);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Failed to create collection in vector database, please try again later.' });
	}

	// Create a job to trigger the connection to sync
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const jobBody = {
		connectionId: datasource.connectionId,
		jobType: 'sync',
	};
	await setDatasourceStatus(datasource.teamId, datasourceId, DatasourceStatus.PROCESSING);
	const createdJob = await jobsApi
		.createJob(null, jobBody)
		.then(res => res.data)
		.catch(err => err.data);
	log('createdJob', createdJob);

	// Update the datasource with the connection settings and sync date
	// await setDatasourceLastSynced(req.params.resourceSlug, datasourceId, new Date());

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 200, { });

}

/**
* @api {delete} /forms/datasource/[datasourceId] Delete a datasource
* @apiName delete
* @apiGroup Datasource
*
* @apiParam {String} datasourceID datasource id
*/
export async function deleteDatasourceApi(req, res, next) {

	if (!req.params.datasourceId || typeof req.params.datasourceId !== 'string' || req.params.datasourceId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const datasource = await getDatasourceById(req.params.resourceSlug, req.params.datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Delete the points in qdrant
	try {
		await VectorDBProxy.deleteCollectionFromQdrant(req.params.datasourceId);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Failed to delete points from vector database, please try again later.' });
	}

	// Run a reset job in airbyte
	if (datasource.connectionId) {
		const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
		const jobBody = {
			connectionId: datasource.connectionId,
			jobType: 'reset',
		};
		const resetJob = await jobsApi
			.createJob(null, jobBody)
			.then(res => res.data);
		log('resetJob', resetJob);

		// Delete the connection in airbyte
		const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
		const connectionBody = {
			connectionId: datasource.connectionId,
		};
		const deletedConnection = await connectionsApi
			.deleteConnection(connectionBody, connectionBody)
			.then(res => res.data);
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
			sourceId: datasource.sourceId,
		};
		const deletedSource = await sourcesApi
			.deleteSource(sourceBody, sourceBody)
			.then(res => res.data);
	}

	// Delete the datasourcein the db
	await deleteDatasourceById(req.params.resourceSlug, req.params.datasourceId);

	//TODO: on any failures, revert the airbyte api calls like a transaction	

	return dynamicResponse(req, res, 200, { /**/ });

}

export async function uploadFileApi(req, res, next) {

	const { modelId, name, datasourceDescription } = req.body;
	log(modelId, name, datasourceDescription);
	if (!req.files || Object.keys(req.files).length === 0
			|| !modelId || typeof modelId !== 'string'
			|| !name || typeof name !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const uploadedFile = req.files.file;
	let fileExtension = path.extname(uploadedFile.name);
	const fileFormat = getFileFormat(fileExtension);
	if (!fileFormat) {
		return dynamicResponse(req, res, 400, { error: 'Invalid file format' });
	}

	const model = await getModelById(req.params.resourceSlug, modelId);
	if (!model) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create the datasource in the db
	const newDatasourceId = new ObjectId();
	const filename = `${newDatasourceId.toString()}${fileExtension}`;
	await addDatasource({
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
	    lastSyncedDate: new Date(), //TODO: make this null and then get updated once file upload dataources have some webhook/completion feedbackl
	    chunkCharacter: req.body.chunkCharacter, //TODO: validate
	    chunkStrategy: req.body.chunkStrategy, //TODO: validate
	    modelId: toObjectId(modelId),
	    createdDate: new Date(),
	    embeddingField: 'document', //Note: always document for sourceType: file
	    status: DatasourceStatus.EMBEDDING, //TODO: have a feedback message when actually READY/set this from vector db proxy
	});
	
	// Send the gcs file path to rabbitmq
	const storageProvider = StorageProviderFactory.getStorageProvider();
	await storageProvider.addFile(filename, uploadedFile);

	// Create the collection in qdrant
	try {
		await VectorDBProxy.createCollectionInQdrant(newDatasourceId);
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 400, { error: 'Failed to create collection in vector database, please try again later.' });
	}

	// Tell the vector proxy to process it	
	await sendMessage(JSON.stringify({
		bucket: process.env.NEXT_PUBLIC_GCS_BUCKET_NAME,
		filename,
		file: `/tmp/${filename}`,
	}), { 
		stream: newDatasourceId.toString(), 
		type: process.env.NEXT_PUBLIC_STORAGE_PROVIDER,
	});

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
		data: {
			builtin: false,
			name: toSnakeCase(name),
		},
		icon: foundIcon ? {
			id: foundIcon._id,
			filename: foundIcon.filename,
		} : null,
	});

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/datasources`*/ });

}
