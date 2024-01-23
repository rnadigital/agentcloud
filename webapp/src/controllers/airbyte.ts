'use strict';

import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getSpecification from 'airbyte/getspecification';
import getAirbyteInternalApi from 'airbyte/internal';

import { getDatasourceById } from '../db/datasource';
import toObjectId from '../lib/misc/toobjectid';
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
	const jobsRes = await jobsApi
		.listJobs(null, jobBody)
		.then(res => res.data);
	// console.log('listJobs', jobsRes);

	return dynamicResponse(req, res, 200, {
		jobs: jobsRes?.data || [],
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
