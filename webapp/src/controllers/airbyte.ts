'use strict';

import { dynamicResponse } from '@dr';
import { io } from '@socketio';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import getAirbyteInternalApi from 'airbyte/internal';
import {
	getDatasourceByConnectionId,
	getDatasourceById,
	incrementDatasourceTotalRecordCount,
	setDatasourceLastSynced,
	setDatasourceStatus,
	unsafeGetDatasourceById
} from 'db/datasource';
import { addNotification } from 'db/notification';
import debug from 'debug';
import * as airbyteSetup from 'lib/airbyte/setup';
import posthog from 'lib/posthog';
import { chainValidations } from 'lib/utils/validationutils';
import toObjectId from 'misc/toobjectid';
import { DatasourceStatus } from 'struct/datasource';
import { CollectionName } from 'struct/db';
import { NotificationDetails, NotificationType, WebhookType } from 'struct/notification';
import { v4 as uuidv4 } from 'uuid';

import { getTeamById } from '../db/team';
const warn = debug('webapp:controllers:airbyte:warning');
warn.log = console.warn.bind(console); //set namespace to log
const log = debug('webapp:controllers:airbyte');
log.log = console.log.bind(console); //set namespace to log

export async function connectorsJson(req, res, next) {
	const internalApi = await getAirbyteInternalApi();
	const listSourceDefinitionsForWorkspaceBody = {
		workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID
	};
	const sourceDefinitionsRes = await internalApi
		.listSourceDefinitionsForWorkspace(null, listSourceDefinitionsForWorkspaceBody)
		.then(res => res.data);
	return res.json({
		sourceDefinitions: sourceDefinitionsRes?.sourceDefinitions || [],
		account: res.locals.account
	});
}

/**
 * GET /airbyte/schema
 * get the specification for an airbyte source
 */
export async function specificationJson(req, res, next) {
	let validationError = chainValidations(
		req.query,
		[{ field: 'sourceDefinitionId', validation: { notEmpty: true, ofType: 'string' } }],
		{ sourceDefinitionId: 'Source Definition ID' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}
	const internalApi = await getAirbyteInternalApi();
	const getSourceDefinitionSpecificationBody = {
		workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
		sourceDefinitionId: req.query.sourceDefinitionId
	};
	const sourceDefinitionRes = await internalApi
		.getSourceDefinitionSpecification(null, getSourceDefinitionSpecificationBody)
		.then(res => res.data);
	if (!sourceDefinitionRes) {
		return dynamicResponse(req, res, 400, {
			error: `No connector found for specification ID: ${req.query.sourceDefinitionId}`
		});
	}
	return res.json({ schema: sourceDefinitionRes, account: res.locals.account });
}

/**
 * GET /airbyte/jobs
 * list airbyte sync jobs for a connection
 */
export async function listJobsApi(req, res, next) {
	const { datasourceId } = req.query;

	let validationError = chainValidations(
		req.query,
		[{ field: 'datasourceId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
		{ datasourceId: 'Datasource ID' }
	);
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
		limit: 20 //TODO: expose on frontend, pagination, etc
	};
	// log('jobBody %O', jobBody);
	const jobsRes = await jobsApi.listJobs(jobBody).then(res => res.data);
	// log('listJobs %O', jobsRes);

	return dynamicResponse(req, res, 200, {
		jobs: jobsRes?.data || []
	});
}

/**
 * GET /airbyte/sources/schema
 * list airbyte sync jobs for a connection
 */
export async function discoverSchemaApi(req, res, next) {
	const { datasourceId } = req.query;

	let validationError = chainValidations(
		req.query,
		[{ field: 'datasourceId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
		{ datasourceId: 'Datasource ID' }
	);
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
		disable_cache: true //Note: should this always be true? For now, yes
	};
	log('discoverSchemaBody %O', discoverSchemaBody);
	const discoveredSchema = await internalApi
		.discoverSchemaForSource(null, discoverSchemaBody)
		.then(res => res.data);
	log('discoveredSchema %O', discoveredSchema);

	// Get stream properties to get correct sync modes from airbyte
	let streamProperties;
	try {
		const streamsApi = await getAirbyteApi(AirbyteApiType.STREAMS);
		const streamPropertiesBody = {
			sourceId: datasource.sourceId,
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

	return dynamicResponse(req, res, 200, {
		discoveredSchema,
		streamProperties
	});
}

async function extractWebhookDetails(responseData) {
	const jobId = responseData?.data?.jobId || '';
	const connectionId = responseData?.data?.connection?.id || '';
	const datasourceId = (await getDatasourceByConnectionId(connectionId))?._id?.toString() || '';
	const recordsLoaded = responseData?.data?.recordsCommitted || 0;
	const logUrl = responseData?.data?.connection?.url || '';
	return { jobId, datasourceId, recordsLoaded, logUrl };
}

export async function handleSuccessfulSyncWebhook(req, res, next) {
	log('handleSuccessfulSyncWebhook body %O', req.body);

	//TODO: validate some kind of webhook key

	const { jobId, datasourceId, recordsLoaded } = await extractWebhookDetails(
		req.body?.blocks || []
	);
	const noDataToSync = recordsLoaded === 0;
	if (jobId && datasourceId) {
		const datasource = await unsafeGetDatasourceById(datasourceId);
		if (datasource) {
			//Get latest airbyte job data (this success) and read the number of rows to know the total rows sent to destination
			const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
			const jobBody = {
				jobId
			};
			const notification = {
				orgId: toObjectId(datasource.orgId.toString()),
				teamId: toObjectId(datasource.teamId.toString()),
				target: {
					id: datasourceId,
					collection: CollectionName.Notifications,
					property: '_id',
					objectId: true
				},
				title: 'Sync Completed',
				date: new Date(),
				seen: false,
				// stuff specific to notification type
				description:
					datasource?.sourceType === 'file' || noDataToSync
						? `Your sync for datasource "${datasource.name}" has completed.`
						: `Embedding is in progress for datasource "${datasource.name}".`,
				type: NotificationType.Webhook,
				details: {
					webhookType: WebhookType.SuccessfulSync
				} as NotificationDetails
			};
			await Promise.all([
				addNotification(notification),
				setDatasourceLastSynced(datasource.teamId, datasourceId, new Date()),
				setDatasourceStatus(
					datasource.teamId,
					datasourceId,
					noDataToSync ? DatasourceStatus.READY : DatasourceStatus.EMBEDDING
				),
				incrementDatasourceTotalRecordCount(datasource.teamId, datasourceId, recordsLoaded)
			]);
			io.to(datasource.teamId.toString()).emit('notification', notification);
		}
	} else {
		warn(`No match found in sync-success webhook body: ${JSON.stringify(req.body)}`);
	}

	return dynamicResponse(req, res, 200, {});
}

export async function handleProblemWebhook(req, res, next) {
	log('handleProblemWebhook body %s', JSON.stringify(req.body));

	//TODO: validate some kind of webhook key?

	let validationError = chainValidations(
		req.query,
		[
			{
				field: 'event',
				validation: {
					notEmpty: true,
					inSet: new Set([
						'sendOnBreakingChangeSyncsDisabled',
						'sendOnBreakingChangeWarning',
						'sendOnFailure'
					])
				}
			}
		],
		{}
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { jobId, datasourceId, logUrl } = await extractWebhookDetails(req.body || {});

	log('extractWebhookDetails', { jobId, datasourceId, logUrl });

	if (datasourceId) {
		const datasource = await unsafeGetDatasourceById(datasourceId);
		const team = await getTeamById(datasource?.teamId);
		let logUrlPath = '';
		try {
			logUrlPath = new URL(logUrl).pathname;
		} catch {
			/* ignore this error */
		}
		const posthogBody = {
			distinctId: uuidv4(),
			event: req.query.event,
			properties: {
				text: req?.body?.text, //raw text from airbytes garbage unformatted webhooks
				jobId, //airbyte job id
				datasourceId, //datasource mongo id
				datasourceName: datasource?.name, //datasource name
				teamId: datasource?.teamId, //datasource team id
				orgId: datasource?.orgId, //datasource org id
				teamName: team?.name, //name of team that matches teamid
				logUrl: `${process.env.AIRBYTE_WEB_URL}${logUrlPath}`
			}
		};
		if (posthog) {
			log('posthog.capture %O', posthogBody);
			posthog.capture(posthogBody);
		}
	}

	return dynamicResponse(req, res, 200, {});
}

export async function handleSuccessfulEmbeddingWebhook(req, res, next) {
	log('handleSuccessfulEmbeddingWebhook body %O', req.body);

	//TODO: validate some kind of webhook key

	// TODO: body validation
	const { datasourceId } = req.body;

	const datasource = await unsafeGetDatasourceById(datasourceId);
	if (datasource) {
		const notification = {
			orgId: toObjectId(datasource.orgId.toString()),
			teamId: toObjectId(datasource.teamId.toString()),
			target: {
				id: datasourceId,
				collection: CollectionName.Notifications,
				property: '_id',
				objectId: true
			},
			title: 'Embedding Successful',
			date: new Date(),
			seen: false,
			// stuff specific to notification type
			description: `Embedding completed for datasource "${datasource.name}".`,
			type: NotificationType.Webhook,
			details: {
				webhookType: WebhookType.EmbeddingCompleted
			} as NotificationDetails
		};
		await Promise.all([
			addNotification(notification),
			setDatasourceStatus(datasource.teamId, datasourceId, DatasourceStatus.READY)
		]);
		io.to(datasource.teamId.toString()).emit('notification', notification);
	}

	return dynamicResponse(req, res, 200, {});
}

export async function checkAirbyteConnection(req, res, next) {
	const status = await airbyteSetup.checkAirbyteStatus();

	let isEnabled = process.env.NEXT_PUBLIC_IS_AIRBYTE_ENABLED === 'true';

	if (status && !isEnabled) {
		isEnabled = await airbyteSetup.init();
	}

	if (!status) {
		process.env.NEXT_PUBLIC_IS_AIRBYTE_ENABLED = 'false';
	}

	return dynamicResponse(req, res, 201, { isEnabled });
}
