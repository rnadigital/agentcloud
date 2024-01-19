'use strict';

import { getDatasourcesByTeam, addDatasource, getDatasourceById, deleteDatasourceById, editDatasource, setDatasourceConnectionId } from '../db/datasource';
import { dynamicResponse } from '../util';
import toSnakeCase from 'misc/tosnakecase';
import { ObjectId } from 'mongodb';
import { uploadFile, deleteFile } from 'lib/google/gcs';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getAirbyteInternalApi from 'airbyte/internal';
import getFileFormat from 'misc/getfileformat';
import convertStringToJsonl from 'misc/converttojsonl';
import path from 'path';
import { readFileSync } from 'fs';
import toObjectId from 'misc/toobjectid';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { sendMessage } from 'lib/rabbitmq/send';
import { PDFExtract } from 'pdf.js-extract';
import getConnectors from 'airbyte/getconnectors';
import Ajv from 'ajv';
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
	const datasources = await getDatasourcesByTeam(req.params.resourceSlug);
	return {
		csrf: req.csrfToken(),
		datasources,
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
	const datasource = await getDatasourceById(req.params.resourceSlug, req.params.datasourceId);
	return {
		csrf: req.csrfToken(),
		datasource,
	};
}

/**
* GET /[resourceSlug]/datasource/:datasourceId.json
* datasource json data
*/
export async function datasourceJson(req, res, next) {
	const data = await datasourcesData(req, res, next);
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

	const { connectorId, connectorName, datasourceName, sourceConfig }  = req.body;

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
	console.log(JSON.stringify(spec, null, 2));
	try {
		const validate = ajv.compile(spec);
		const validated = validate(req.body.sourceConfig);
		if (validate?.errors?.filter(p => p?.params?.pattern !== '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$')?.length > 0) {
			console.log('validate.errors', validate?.errors);
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	} catch(e) {
		console.log(e);
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create source in airbyte based on the validated form
	const sourcesApi = await getAirbyteApi(AirbyteApiType.SOURCES);
	const sourceType = submittedConnector?.githubIssueLabel_oss?.replace('source-', '') || submittedConnector?.sourceType_oss;
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
	console.log('sourceBody', sourceBody);	
	const createdSource = await sourcesApi
		.createSource(null, sourceBody)
		.then(res => res.data);
	console.log('createdSource', createdSource);

	// Test connection to the source
	const internalApi = await getAirbyteInternalApi();
	const checkConnectionBody = {
		sourceId: createdSource.sourceId,
	};
	console.log('checkConnectionBody', checkConnectionBody);
	const connectionTest = await internalApi
		.checkConnectionToSource(null, checkConnectionBody)
		.then(res => res.data);
	console.log('connectionTest', connectionTest);

	// Discover the schema
	const discoverSchemaBody = {
		sourceId: createdSource.sourceId,
	};
	console.log('discoverSchemaBody', discoverSchemaBody);
	const discoveredSchema = await internalApi
		.discoverSchemaForSource(null, discoverSchemaBody)
		.then(res => res.data);
	console.log('discoveredSchema', JSON.stringify(discoveredSchema, null, 2));

	// Create the actual datasource in the db
	const createdDatasource = await addDatasource({
	    _id: newDatasourceId,
	    orgId: toObjectId(res.locals.matchingOrg.id),
	    teamId: toObjectId(req.params.resourceSlug),
	    name: newDatasourceId.toString(),
	    gcsFilename: null,
	    originalName: datasourceName,
	    sourceId: createdSource.sourceId,
	    connectionId: null, // no connection at this point, that comes after schema check and selecting streams
	    destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID,
	    sourceType,
	    workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
	});

	return dynamicResponse(req, res, 200, {
		sourceId: createdSource.sourceId,
		discoveredSchema,
		datasourceId: createdDatasource.insertedId,
	});

}

export async function addDatasourceApi(req, res, next) {

	const { datasourceId }  = req.body;

	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	// Create a connection to our destination in airbyte
	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const connectionBody = {
		schedule: {scheduleType: 'manual'},
		dataResidency: 'auto',
		namespaceDefinition: 'destination',
		namespaceFormat: null,
		nonBreakingSchemaUpdatesBehavior: 'ignore',
		name: datasource.sourceId,
		sourceId: datasource.sourceId,
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID,
		status: 'active'
	};
	const createdConnection = await connectionsApi
		.createConnection(null, connectionBody)
		.then(res => res.data);
	console.log('createdConnection', createdConnection);

	// Create a job to trigger the connection to sync
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const jobBody = {
		connectionId: createdConnection.connectionId,
		jobType: 'sync',
	};
	const createdJob = await jobsApi
		.createJob(null, jobBody)
		.then(res => res.data);
	console.log('createdJob', createdJob);

	// Update the datasource with the connetionId
	await setDatasourceConnectionId(datasourceId, req.params.resourceSlug, createdConnection.connectionId);

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/datasources` });

}

export async function editDatasourceApi(req, res, next) {

	const { name /* TODO */ }  = req.body;

	//TODO: form validation
	
	//TODO: editDatasource

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/datasources`*/ });

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
		console.log('resetJob', resetJob);
		
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
	if (datasource.sourceType === 'file') { //TODO: make an enum?
		await deleteFile(datasource.gcsFilename);
	}

	// Delete the source in airbyte
	const sourcesApi = await getAirbyteApi(AirbyteApiType.SOURCES);
	const sourceBody = {
		sourceId: datasource.sourceId,
	};
	const deletedSource = await sourcesApi
		.deleteSource(sourceBody, sourceBody)
		.then(res => res.data);

	// Delete the datasourcein the db
	await deleteDatasourceById(req.params.resourceSlug, req.params.datasourceId);

	//TODO: on any failures, revert the airbyte api calls like a transaction
	
	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/datasources` });

}

export async function uploadFileApi(req, res, next) {

	if (!req.files || Object.keys(req.files).length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const uploadedFile = req.files.file;
	let fileExtension = path.extname(uploadedFile.name);
	const fileFormat = getFileFormat(fileExtension);
	if (!fileFormat) {
		return dynamicResponse(req, res, 400, { error: 'Invalid file format' });
	}

	// Create the datasource in the db
	const newDatasourceId = new ObjectId();
	const filename = `${newDatasourceId.toString()}${fileExtension}`;
	await addDatasource({
	    _id: newDatasourceId,
	    orgId: toObjectId(res.locals.matchingOrg.id),
	    teamId: toObjectId(req.params.resourceSlug),
	    name: newDatasourceId.toString(),
	    gcsFilename: filename,
	    originalName: uploadedFile.name,
	    sourceId: null,
	    connectionId: null,
	    destinationId: null,
	    sourceType: 'file',
	    workspaceId: null,
	});
	
	// Send the gcs file path to rabbitmq
	await uploadFile(filename, uploadedFile);
	await sendMessage(filename, { stream: newDatasourceId.toString() });

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/datasources` });

}
