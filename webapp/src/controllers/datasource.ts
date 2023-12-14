'use strict';

import { getDatasourcesByTeam, addDatasource, getDatasourceById, deleteDatasourceById, editDatasource } from '../db/datasource';
import { dynamicResponse } from '../util';
import toSnakeCase from 'misc/tosnakecase';
import { ObjectId } from 'mongodb';
import { uploadFile } from 'lib/google/gcs';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getFileFormat from 'misc/getfileformat';
import convertStringToJsonl from 'misc/converttojsonl';
import path from 'path';
import { readFileSync } from 'fs';
import toObjectId from 'misc/toobjectid';
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

	const { name /* TODO */ }  = req.body;

	//TODO: form validation
	
	//TODO: addDatasource

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

	const { datasourceId } = req.body;

	if (!datasourceId || typeof datasourceId !== 'string' || datasourceId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// await deleteDatasourceById(req.params.resourceSlug, datasourceId);

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/agents`*/ });

}

export async function uploadFileApi(req, res, next) {

	if (!req.files || Object.keys(req.files).length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	//TODO: validation on filetype, etc

	const uploadedFile = req.files.file;
	let fileExtension = path.extname(uploadedFile.name);
	if (fileExtension === '.txt') { //TODO: more advanced file processing to coalesce it into something airbyte understands
		const convertedJsonl = convertStringToJsonl(uploadedFile.data.toString('utf-8'));
		uploadedFile.data = Buffer.from(convertedJsonl, 'utf-8');
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
		name: newDatasourceId.toString()
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
	    name: newDatasourceId.toString(), //TODO: form on frontend
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
