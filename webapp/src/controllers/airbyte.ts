'use strict';

import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getSpecification from 'airbyte/getspecification';
import getAirbyteInternalApi from 'airbyte/internal';
import { DatasourceStatus } from 'struct/datasource';

import { getDatasourceByConnectionId, getDatasourceById, getDatasourceByIdUnsafe, setDatasourceLastSynced,setDatasourceStatus } from '../db/datasource';
import toObjectId from '../lib/misc/toobjectid';
import { io } from '../socketio';
import { dynamicResponse } from '../util';

/**
 * GET /airbyte/schema
 * get the specification for an airbyte source
 */
export async function specificationJson(req, res, next) {
	if (!req?.query?.sourceDefinitionId || typeof req.query.sourceDefinitionId !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	const data = await getSpecification(req, res, next);
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

	//TODO: validate some kind of webhook key

	// TODO: TODO'nt
	const regex = /Your connection ([\w-]+) from (\w+) to (\w+) succeeded.*sync started on (.*), running for (\d+ seconds).*logs here: (http:\/\/localhost:8000\/workspaces\/[\w-]+\/connections\/[\w-]+).*Job ID: (\d+)/s;

	const match = req?.body?.text?.match(regex);

	if (match) {
		const payload = {
			datasourceId: match[1],
			source: match[2],
			destination: match[3],
			startTime: match[4],
			duration: match[5],
			logsUrl: match[6],
			jobId: match[7],
			text: req.body.text, //The input text
		};
		if (payload?.datasourceId) {
			const datasource = await getDatasourceByIdUnsafe(payload.datasourceId);
			if (datasource) {
				io.to(datasource.teamId.toString()).emit('notification', payload); //TODO: change to emit notification after inserting
				await Promise.all([
					setDatasourceLastSynced(datasource.teamId, payload.datasourceId, new Date()),
					setDatasourceStatus(datasource.teamId, payload.datasourceId, DatasourceStatus.READY)
				]);
			}
		}
	}

	return dynamicResponse(req, res, 200, { });

}
