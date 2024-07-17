'use strict';

import { dynamicResponse } from '@dr';
import { io } from '@socketio';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getSpecification from 'airbyte/getspecification';
import getAirbyteInternalApi from 'airbyte/internal';
import { getDatasourceById, getDatasourceByIdUnsafe, setDatasourceLastSynced, setDatasourceStatus, setDatasourceTotalRecordCount } from 'db/datasource';
import { addNotification } from 'db/notification';
import debug from 'debug';
import { chainValidations } from 'lib/utils/validationUtils';
import toObjectId from 'misc/toobjectid';
import { DatasourceStatus } from 'struct/datasource';
import { CollectionName } from 'struct/db';
import { NotificationDetails, NotificationType, WebhookType } from 'struct/notification';
const warn = debug('webapp:controllers:airbyte:warning');
warn.log = console.warn.bind(console); //set namespace to log
const log = debug('webapp:controllers:airbyte');
log.log = console.log.bind(console); //set namespace to log

/**
 * GET /airbyte/schema
 * get the specification for an airbyte source
 */
export async function specificationJson(req, res, next) {

	let validationError = chainValidations(req.query, [
		{ field: 'sourceDefinitionId', validation: { notEmpty: true, ofType: 'string' }},
	], { sourceDefinitionId: 'Source Definition ID' });
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
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

	let validationError = chainValidations(req.query, [
		{ field: 'datasourceId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' }},
	], { datasourceId: 'Datasource ID' });
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
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
	// log('jobBody %O', jobBody);
	const jobsRes = await jobsApi
		.listJobs(jobBody)
		.then(res => res.data);
	// log('listJobs %O', jobsRes);

	return dynamicResponse(req, res, 200, {
		jobs: (jobsRes?.data || []),
	});

}

/**
 * GET /airbyte/sources/schema
 * list airbyte sync jobs for a connection
 */
export async function discoverSchemaApi(req, res, next) {

	const { datasourceId } = req.query;

	let validationError = chainValidations(req.query, [
		{ field: 'datasourceId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' }},
	], { datasourceId: 'Datasource ID' });
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
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
	log('discoverSchemaBody %O', discoverSchemaBody);
	const discoveredSchema = await internalApi
		.discoverSchemaForSource(null, discoverSchemaBody)
		.then(res => res.data);
	log('discoveredSchema %O', discoveredSchema);

	return dynamicResponse(req, res, 200, {
		discoveredSchema,
	});

}

function extractWebhookSuccesfulDetails(data) {
	// Initialize variables
	let jobId = '';
	let datasourceId = '';
	let recordsLoaded = 0;

	// Parse through each section to find relevant data
	data.forEach(section => {
		if (section.text && section.text.text) {
			if (section.text.text.includes('Sync completed:')) {
				const regex = /connections\/([\w-]+)\|([\w-]+)/;
				const match = section.text.text.match(regex);
				if (match) {
					datasourceId = match[2]; // Changed to extract the ID after the pipe
					jobId = match[1]; // Assuming the other ID is the job ID for clarity
				}
			}
			if (section.text.text.includes('Sync Summary:')) {
				const summaryRegex = /(\d+) record\(s\) loaded/;
				const summaryMatch = section.text.text.match(summaryRegex);
				if (summaryMatch) {
					recordsLoaded = parseInt(summaryMatch[1], 10);
				}
			}
		}
	});

	return { jobId, datasourceId, recordsLoaded };
}

export async function handleSuccessfulSyncWebhook(req, res, next) {
	log('handleSuccessfulSyncWebhook body %O', req.body);

	//TODO: validate some kind of webhook key

	const { jobId, datasourceId, recordsLoaded } = extractWebhookSuccesfulDetails(req.body?.blocks || []);
	if (jobId && datasourceId) {
		const datasource = await getDatasourceByIdUnsafe(datasourceId);
		if (datasource) {
			//Get latest airbyte job data (this success) and read the number of rows to know the total rows sent to destination
			const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
			const jobBody = {
				jobId,
			};
			const notification = {
				orgId: toObjectId(datasource.orgId.toString()),
				teamId: toObjectId(datasource.teamId.toString()),
				target: {
					id: datasourceId,
					collection: CollectionName.Notifications,
					property: '_id',
					objectId: true,
				},
				title: 'Sync Completed',
				date: new Date(),
				seen: false,
				// stuff specific to notification type
				description: `Your sync for datasource "${datasource.name}" has completed.`,
				type: NotificationType.Webhook,
				details: {
					webhookType: WebhookType.SuccessfulSync,
				} as NotificationDetails,
			};
			await Promise.all([
				addNotification(notification),
				setDatasourceLastSynced(datasource.teamId, datasourceId, new Date()),
				setDatasourceStatus(datasource.teamId, datasourceId, DatasourceStatus.EMBEDDING),
				setDatasourceTotalRecordCount(datasource.teamId, datasourceId, recordsLoaded),
			]);
			io.to(datasource.teamId.toString()).emit('notification', notification);
		}
	} else {
		warn(`No match found in sync-success webhook body: ${JSON.stringify(req.body)}`);
	}

	return dynamicResponse(req, res, 200, {});

}

export async function handleSuccessfulEmbeddingWebhook(req, res, next) {
	log('handleSuccessfulEmbeddingWebhook body %O', req.body);

	//TODO: validate some kind of webhook key

	// TODO: body validation
	const { datasourceId } = req.body;

	const datasource = await getDatasourceByIdUnsafe(datasourceId);
	if (datasource) {
		const notification = {
			orgId: toObjectId(datasource.orgId.toString()),
			teamId: toObjectId(datasource.teamId.toString()),
			target: {
				id: datasourceId,
				collection: CollectionName.Notifications,
				property: '_id',
				objectId: true,
			},
			title: 'Embedding Successful',
			date: new Date(),
			seen: false,
			// stuff specific to notification type
			description: `Embedding completed for datasource "${datasource.name}".`,
			type: NotificationType.Webhook,
			details: {
				webhookType: WebhookType.EmbeddingCompleted,
			} as NotificationDetails,
		};
		await Promise.all([
			addNotification(notification),
			setDatasourceStatus(datasource.teamId, datasourceId, DatasourceStatus.READY)
		]);
		io.to(datasource.teamId.toString()).emit('notification', notification);
	}

	return dynamicResponse(req, res, 200, {});

}
