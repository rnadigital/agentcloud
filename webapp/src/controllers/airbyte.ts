'use strict';

import { dynamicResponse } from '@dr';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getSpecification from 'airbyte/getspecification';
import getAirbyteInternalApi from 'airbyte/internal';
import { addNotification } from 'db/notification';
import { DatasourceStatus } from 'struct/datasource';

import { getDatasourceByConnectionId, getDatasourceById, getDatasourceByIdUnsafe, setDatasourceLastSynced,setDatasourceStatus,setDatasourceSyncedCount } from '../db/datasource';
import toObjectId from '../lib/misc/toobjectid';
import { io } from '../socketio';
/**
 * GET /airbyte/schema
 * get the specification for an airbyte source
 */
export async function specificationJson(req, res, next) {
	if (!req?.query?.sourceDefinitionId || typeof req.query.sourceDefinitionId !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	let data;
	try {
		data = await getSpecification(req, res, next);
	} catch (e) {
		return dynamicResponse(req, res, 400, { error: `Falied to fetch connector specification: ${e}` });
	}
	if (!data) {
		return dynamicResponse(req, res, 400, { error: `No connector found for specification ID: ${req.query.sourceDefinitionId}` });
	}
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /airbyte/jobs
 * list airbyte sync jobs for a connection
 */
export async function listJobsApi(req, res, next) {

	const { datasourceId } = req.query;

	if (!datasourceId || typeof datasourceId !== 'string' || datasourceId.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	
	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	
	// Create a job to trigger the connection to sync
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const jobBody = {
		connectionId: datasource.connectionId,
		jobType: 'sync',
		limit: 20, //TODO: expose on frontend, pagination, etc
	};
	// console.log('jobBody', jobBody);
	const jobsRes = await jobsApi
		.listJobs(jobBody)
		.then(res => res.data);
	// console.log('listJobs', jobsRes);

	return dynamicResponse(req, res, 200, {
		jobs: (jobsRes?.data || []),
	});

}

/**
 * POST /airbyte/jobs
 * trigger a sync or reset job for a connection
 */
export async function triggerJobApi(req, res, next) {

}

/**
 * GET /airbyte/sources/schema
 * list airbyte sync jobs for a connection
 */
export async function discoverSchemaApi(req, res, next) {

	const { datasourceId } = req.query;

	if (!datasourceId || typeof datasourceId !== 'string' || datasourceId.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	
	const datasource = await getDatasourceById(req.params.resourceSlug, datasourceId);

	if (!datasource) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	// Discover the schema
	const internalApi = await getAirbyteInternalApi();
	const discoverSchemaBody = {
		sourceId: datasource.sourceId,
		// disable_cache: true, //Note: should this always be true?
	};
	console.log('discoverSchemaBody', discoverSchemaBody);
	const discoveredSchema = await internalApi
		.discoverSchemaForSource(null, discoverSchemaBody)
		.then(res => res.data);
	console.log('discoveredSchema', JSON.stringify(discoveredSchema, null, 2));

	return dynamicResponse(req, res, 200, {
		discoveredSchema,
	});

}

export async function handleSuccessfulSyncWebhook(req, res, next) {
	console.log('handleSuccessfulSyncWebhook body', req.body);

	//TODO: validate some kind of webhook key

	// TODO: TODO'nt
	const regex = /Your connection ([\w-]+) from (\w+) to (\w+) succeeded.*sync started on (.*), running for (\d+ seconds).*logs here: (http:\/\/localhost:8000\/workspaces\/[\w-]+\/connections\/[\w-]+).*Job ID: (\d+)/s;

	const match = req?.body?.text?.match(regex);

	if (match) {
		const datasourceId = match[1];
		if (datasourceId) {
			const datasource = await getDatasourceByIdUnsafe(datasourceId);
			if (datasource) {
				//Get latest airbyte job data (this success) and read the number of rows to know the total rows sent to destination
				const jobId = match[7];
				const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
				const jobBody = {
					jobId,
				};
				const jobData = await jobsApi
					.getJob(jobBody)
					.then(res => res.data)
					.catch(res => {});
				await Promise.all([
					addNotification({
					    orgId: toObjectId(datasource.orgId.toString()),
					    teamId: toObjectId(datasource.teamId.toString()),
					    target: {
							id: datasourceId,
							collection: 'notifications',
							property: '_id',
							objectId: true,
					    },
					    title: 'Sync Successful',
					    description: req.body.text,
					    date: new Date(),
					    seen: false,
					}),
					setDatasourceLastSynced(datasource.teamId, datasourceId, new Date()),
					setDatasourceStatus(datasource.teamId, datasourceId, DatasourceStatus.EMBEDDING),
					jobData ? setDatasourceSyncedCount(datasource.teamId, datasourceId, parseInt(jobData?.rowsSynced||0)) : void 0,
				]);
			}
		}
	}

	return dynamicResponse(req, res, 200, { });

}

export async function handleSuccessfulEmbeddingWebhook(req, res, next) {
	console.log('handleSuccessfulEmbeddingWebhook body', req.body);

	//TODO: validate some kind of webhook key

	// TODO: body validation
	const { datasourceId } = req.body;

	const datasource = await getDatasourceByIdUnsafe(datasourceId);
	if (datasource) {
		setTimeout(async () => {
			await Promise.all([
				addNotification({
				    orgId: toObjectId(datasource.orgId.toString()),
				    teamId: toObjectId(datasource.teamId.toString()),
				    target: {
						id: datasourceId,
						collection: 'notifications',
						property: '_id',
						objectId: true,
				    },
				    title: 'Embedding Successful',
				    description: `Embedding completed for datasource "${datasource.name}".`,
				    date: new Date(),
				    seen: false,
				}),
				setDatasourceStatus(datasource.teamId, datasourceId, DatasourceStatus.READY)
			]);
			io.to(datasource.teamId.toString()).emit('notification', datasourceId);
		}, 5000); //TODO: remove hardcoded timeout and fix fo real
	}

	return dynamicResponse(req, res, 200, { });

}

