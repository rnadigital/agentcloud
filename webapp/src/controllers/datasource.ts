'use strict';

import { getDatasourcesByTeam, addDatasource, getDatasourceById, deleteDatasourceById, editDatasource } from '../db/datasource';
import { dynamicResponse } from '../util';
import toSnakeCase from 'misc/tosnakecase';
import { ObjectId } from 'mongodb';
import { uploadFile, deleteFile } from 'lib/google/gcs';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getFileFormat from 'misc/getfileformat';
import convertStringToJsonl from 'misc/converttojsonl';
import path from 'path';
import { readFileSync } from 'fs';
import toObjectId from 'misc/toobjectid';
import { promisify } from 'util';
import { PDFExtract } from 'pdf.js-extract';
import getConnectors from 'airbyte/getconnectors';
const pdfExtract = new PDFExtract();
import Ajv from 'ajv';
const ajv = new Ajv({ strict: 'log' });
const pdfExtractPromisified = promisify(pdfExtract.extractBuffer);
import dotenv from 'dotenv';
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

export async function addDatasourceApi(req, res, next) {

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
	try {
		const validate = ajv.compile(spec);
		const validated = validate(req.body.sourceConfig);
		if (!validated || validate?.errors?.length > 0 ) {
			//TODO: forward the errors to frontend and display them
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	} catch(e) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Create source in airbyte based on the validated form
	const sourcesApi = await getAirbyteApi(AirbyteApiType.SOURCES);
	const sourceType = submittedConnector?.githubIssueLabel_oss?.replace('source-', '') || submittedConnector?.sourceType_oss;
	const sourceBody = {
		configuration: {
			//NOTE: sourceType_oss is "file" (which is incorrect) for e.g. for google sheets, so we use a workaround.
			sourceType,
			...req.body.sourceConfig,
		},
		workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID, //TODO: change to the user-specific workspace, and up above
		name: `${datasourceName} (${newDatasourceId.toString()}) - ${res.locals.account.name} (${res.locals.account._id})`,
	};
	console.log('sourceBody', sourceBody);	
	const createdSource = await sourcesApi
		.createSource(null, sourceBody)
		.then(res => res.data);
	console.log('createdSource', createdSource);

	// return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });

	// Create a connection to our destination in airbyte
	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const connectionBody = {
		schedule: {scheduleType: 'manual'},
		dataResidency: 'auto',
		namespaceDefinition: 'destination',
		namespaceFormat: null,
		nonBreakingSchemaUpdatesBehavior: 'ignore',
		name: createdSource.sourceId,
		sourceId: createdSource.sourceId,
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID, //TODO: not hardcode, or one per team??
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

	//Create the actual datasource in the db
	await addDatasource({
	    _id: newDatasourceId,
	    orgId: toObjectId(res.locals.matchingOrg.id),
	    teamId: toObjectId(req.params.resourceSlug),
	    name: newDatasourceId.toString(),
	    gcsFilename: null,
	    originalName: datasourceName, //TODO?
	    sourceId: createdSource.sourceId,
	    connectionId: createdConnection.connectionId,
	    destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID, //TODO: not hardcode, or one per team??
	    sourceType,
	    workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID, //TODO: change to the user-specific workspace
	});

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
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const jobBody = {
		connectionId: datasource.connectionId,
		jobType: 'reset',
	};
	const resetJob = await jobsApi
		.createJob(null, jobBody)
		.then(res => res.data);
	console.log('resetJob', resetJob);

	// Delete the source file in GCS if this is a file
	if (datasource.sourceType === 'file') { //TODO: make an enum?
		await deleteFile(datasource.gcsFilename);
	}

	// Delete the connection in airbyte
	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const connectionBody = {
		connectionId: datasource.connectionId,
	};
	const deletedConnection = await connectionsApi
		.deleteConnection(connectionBody, connectionBody)
		.then(res => res.data);
	
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

	//TODO: validation on filetype, etc

	const uploadedFile = req.files.file;
	let fileExtension = path.extname(uploadedFile.name);
	//TODO: refactor this "special handling" to a separate module
	switch (fileExtension) {
		case '.txt': {
			const convertedJsonl = convertStringToJsonl(uploadedFile.data.toString('utf-8'));
			uploadedFile.data = Buffer.from(convertedJsonl, 'utf-8');
			break;
		}
		case '.pdf': {
			const pdfData: any = await pdfExtractPromisified(uploadedFile.data, {});
			if (pdfData && pdfData.pages) {
				const pdfJsonl = pdfData.pages
					.reduce((acc, page) => {
						const pageJsons = page.content.map(c => ({
							...c,
							page: page.pageInfo.num,
							pageHeight: page.pageInfo.height,
							pageWidth: page.pageInfo.width,
						}));
						acc = acc.concat(pageJsons);
						return acc;
					}, [])
					.map(x => JSON.stringify(x))
					.join('\n');
				uploadedFile.data = Buffer.from(pdfJsonl, 'utf-8');
			} else {
				return dynamicResponse(req, res, 400, { error: 'Failed to extract text from PDF' });
			}
			break;
		}
		default:
			break; //no special handling for other files
	}
	const fileFormat = getFileFormat(fileExtension);
	if (!fileFormat) {
		return dynamicResponse(req, res, 400, { error: 'Invalid file format' });
	}

	const newDatasourceId = new ObjectId();
	const filename = `${newDatasourceId.toString()}${fileExtension}`;
	await uploadFile(filename, uploadedFile);

	// File is uploaded, create source in airbyte
	const sourcesApi = await getAirbyteApi(AirbyteApiType.SOURCES);
	const sourceBody = {
		configuration: {
			sourceType: 'file',
			format: fileFormat,
			provider: {
				storage: 'GCS',
				service_account_json: JSON.stringify(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, { encoding:'utf-8' }))),
			},
			url: `gs://agentcloud-test/${filename}`,
			dataset_name: newDatasourceId.toString(),
		},
		workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID, //TODO: change to the user-specific workspace, and up above
		name: `${uploadedFile.name} (${newDatasourceId.toString()}) - ${res.locals.account.name} (${res.locals.account._id})`,
	};
	const createdSource = await sourcesApi
		.createSource(null, sourceBody)
		.then(res => res.data);
	console.log('createdSource', createdSource);

	// Create a connection to our destination in airbyte
	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const connectionBody = {
		schedule: {scheduleType: 'manual'},
		dataResidency: 'auto',
		namespaceDefinition: 'destination',
		namespaceFormat: null,
		nonBreakingSchemaUpdatesBehavior: 'ignore',
		name: `${createdSource.sourceId} - ${res.locals.account.name} (${res.locals.account._id})`,
		sourceId: createdSource.sourceId,
		destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID, //TODO: not hardcode, or one per team??
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

	//Create the actual datasource in the db
	await addDatasource({
	    _id: newDatasourceId,
	    orgId: toObjectId(res.locals.matchingOrg.id),
	    teamId: toObjectId(req.params.resourceSlug),
	    name: newDatasourceId.toString(),
	    gcsFilename: filename,
	    originalName: uploadedFile.name,
	    sourceId: createdSource.sourceId,
	    connectionId: createdConnection.connectionId,
	    destinationId: process.env.AIRBYTE_ADMIN_DESTINATION_ID, //TODO: not hardcode, or one per team??
	    sourceType: 'file',
	    workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID, //TODO: change to the user-specific workspace
	});

	//TODO: on any failures, revert the airbyte api calls like a transaction

	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/datasources` });

}
