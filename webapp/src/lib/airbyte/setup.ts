import debug from 'debug';
import dotenv from 'dotenv';
import fs from 'fs';
import getGoogleCredentials from 'misc/getgooglecredentials';
import fetch from 'node-fetch'; // Ensure node-fetch is installed or use a compatible fetch API
import path from 'path';
const { GoogleAuth } = require('google-auth-library');
import * as dns from 'node:dns';
import * as util from 'node:util';
const lookup = util.promisify(dns.lookup);

import getAirbyteApi, { AirbyteApiType, getAirbyteAuthToken } from 'airbyte/api';
import OauthSecretProviderFactory from 'lib/oauthsecret';
import SecretProviderFactory from 'lib/secret';
import { AIRBYTE_OAUTH_PROVIDERS } from 'struct/oauth';

import getAirbyteInternalApi from './internal';

dotenv.config({ path: '.env' });

const log = debug('webapp:airbyte:setup');

// Note: is there an idiomatic way to do this?
const logdebug = debug('webapp:airbyte:setup:debug');
logdebug.log = console.debug.bind(console);
const logerror = debug('webapp:airbyte:setup:error');
logerror.log = console.error.bind(console);

const provider = process.env.MESSAGE_QUEUE_PROVIDER;
export const destinationDefinitionId =
	provider === 'rabbitmq'
		? 'e06ad785-ad6f-4647-b2e8-3027a5c59454' // RabbitMQ destination id
		: '356668e2-7e34-47f3-a3b0-67a8a481b692'; // Google Pub/Sub destination id

// Function to fetch workspaces
async function fetchWorkspaces() {
	const workspacesApi = await getAirbyteApi(AirbyteApiType.WORKSPACES);
	return workspacesApi.listWorkspaces().then(res => res.data);
}

// Function to fetch the destination list
async function fetchDestinationList(workspaceId: string) {
	const response = await fetch(
		`${process.env.AIRBYTE_API_URL}/api/public/v1/destinations?workspaceId=${encodeURIComponent(workspaceId)}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${await getAirbyteAuthToken()}`
			}
		}
	);
	return response.json();
}

// Function to create a destination
async function createDestination(workspaceId: string, provider: string) {
	const destinationConfiguration = await getDestinationConfiguration(provider);
	const response = await fetch(`${process.env.AIRBYTE_API_URL}/api/public/v1/destinations`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${await getAirbyteAuthToken()}`
		},
		body: JSON.stringify({
			name: provider === 'rabbitmq' ? 'RabbitMQ' : 'Google Pub/Sub',
			definitionId: destinationDefinitionId,
			workspaceId,
			configuration: destinationConfiguration
		})
	});
	return response.json();
}

// Function to deletea destination
async function deleteDestination(destinationId: string) {
	const response = await fetch(
		`${process.env.AIRBYTE_API_URL}/api/public/v1/destinations/${destinationId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${await getAirbyteAuthToken()}`
			}
		}
	);
}

async function getDestinationConfiguration(provider: string) {
	if (provider === 'rabbitmq') {
		let host: any = process.env.AIRBYTE_RABBITMQ_HOST || process.env.RABBITMQ_HOST || '0.0.0.0';
		log('getDestinationConfiguration host %s', host);
		return {
			routing_key: 'key',
			username: process.env.RABBITMQ_USERNAME || 'guest',
			password: process.env.RABBITMQ_PASSWORD || 'guest',
			exchange: 'agentcloud',
			port: parseInt(process.env.RABBITMQ_PORT) || 5672,
			host,
			ssl: false
		};
	} else {
		let credentialsContent;
		if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
			if (!credentialsPath) {
				log(
					'missing GOOGLE_APPLICATION_CREDENTIALS path, current value: %s',
					process.env.GOOGLE_APPLICATION_CREDENTIALS
				);
				process.exit(1);
			}
			credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
			if (!credentialsContent) {
				log(
					'Failed to read content of process.env.GOOGLE_APPLICATION_CREDENTIALS file at path: %s',
					process.env.GOOGLE_APPLICATION_CREDENTIALS
				);
				process.exit(1);
			}
		} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
			credentialsContent = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
		} else {
			log('google application credentials missing private_key, fetching from secret store');
			const secretProvider = SecretProviderFactory.getSecretProvider('google');
			await secretProvider.init();
			const googleCreds = await secretProvider.getSecret('GOOGLE_APPLICATION_CREDENTIAL');
			credentialsContent = googleCreds;
		}

		return {
			project_id: process.env.PROJECT_ID,
			topic_id: process.env.QUEUE_NAME,
			credentials_json: credentialsContent,
			ordering_enabled: false,
			batching_enabled: false
		};
	}
}

// Function to update webhook URLs
async function updateWebhookUrls(workspaceId: string) {
	const internalApi = await getAirbyteInternalApi();
	const updateWorkspaceBody = {
		workspaceId,
		notificationSettings: {
			sendOnSuccess: {
				notificationType: ['slack'],
				slackConfiguration: {
					webhook: `${process.env.WEBAPP_WEBHOOK_HOST || process.env.URL_APP}/webhook/sync-successful`
				}
			},
			sendOnBreakingChangeSyncsDisabled: {
				notificationType: ['slack'],
				slackConfiguration: {
					webhook: `${process.env.WEBAPP_WEBHOOK_HOST || process.env.URL_APP}/webhook/sync-problem?event=sendOnBreakingChangeSyncsDisabled`
				}
			},
			sendOnBreakingChangeWarning: {
				notificationType: ['slack'],
				slackConfiguration: {
					webhook: `${process.env.WEBAPP_WEBHOOK_HOST || process.env.URL_APP}/webhook/sync-problem?event=sendOnBreakingChangeWarning`
				}
			},
			sendOnFailure: {
				notificationType: ['slack'],
				slackConfiguration: {
					webhook: `${process.env.WEBAPP_WEBHOOK_HOST || process.env.URL_APP}/webhook/sync-problem?event=sendOnFailure`
				}
			}
		}
	};
	const updateWorkspaceRes = await internalApi
		.updateWorkspace(null, updateWorkspaceBody)
		.then(res => res.data);
	return updateWorkspaceRes;
}

async function overrideOauthCreds(workspaceId, name, clientId, clientSecret) {
	log('workspaceID: ', workspaceId);
	if (workspaceId !== undefined) {
		log('workspaceID: ', workspaceId);
		const updateOauthCredsRes = await fetch(
			`${process.env.AIRBYTE_API_URL}/v1/workspaces/${workspaceId}/oauthCredentials`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getAirbyteAuthToken()}`
				},
				body: {
					actorType: 'source',
					name,
					workspaceId,
					configuration: {
						credentials: {
							client_id: clientId,
							client_secret: clientSecret
						}
					}
				}
			}
		);
		return updateOauthCredsRes;
	}
	return null;
}

// Main logic to handle Airbyte setup and configuration
export async function init() {
	try {
		// Get workspaces
		const workspacesList = await fetchWorkspaces();
		log('workspacesList: %s', workspacesList);
		log('workspacesList: %s', workspacesList?.data?.map(x => x.name)?.join());
		const airbyteAdminWorkspaceId = workspacesList.data[0].workspaceId;

		log('AIRBYTE_ADMIN_WORKSPACE_ID', airbyteAdminWorkspaceId);
		if (!airbyteAdminWorkspaceId) {
			log('Failed to fetch airbyte admin workspace ID, exiting');
			process.exit(1);
		}
		process.env.AIRBYTE_ADMIN_WORKSPACE_ID = airbyteAdminWorkspaceId;

		// Get destination list
		const destinationsList = await fetchDestinationList(airbyteAdminWorkspaceId);
		log('destinationsList: %s', destinationsList?.data?.map(x => x.name)?.join());

		let airbyteAdminDestination = destinationsList.data?.find(d =>
			['RabbitMQ', 'Google Pub/Sub'].includes(d?.name)
		);
		log('AIRBYTE_ADMIN_DESTINATION_ID', airbyteAdminDestination?.destinationId);

		if (airbyteAdminDestination) {
			const currentConfig = airbyteAdminDestination.connectionConfiguration;
			const newConfig = await getDestinationConfiguration(provider);
			console.log('newConfig', newConfig);
			const configMismatch = Object.keys(newConfig).some(key => {
				if (currentConfig && currentConfig[key] === '**********') {
					//hidden fields
					return false; // Skip password/credentials json comparison
				}
				return currentConfig && currentConfig[key] !== newConfig[key];
			});
			console.log('configMismatch', configMismatch);
			if (configMismatch) {
				log('Destination configuration mismatch detected, attempting to delete and re-create...');
				await deleteDestination(airbyteAdminDestination.destinationId);
				airbyteAdminDestination = await createDestination(airbyteAdminWorkspaceId, provider);
				if (!airbyteAdminDestination.destinationId) {
					log('Failed to create new destination with updated config');
					log(airbyteAdminDestination);
					process.exit(1);
				}
			}
		} else {
			if (!provider) {
				log(
					'Invalid process.env.MESSAGE_QUEUE_PROVIDER env value:',
					process.env.MESSAGE_QUEUE_PROVIDER
				);
				process.exit(1);
			}
			log(`Creating ${provider} destination`);
			airbyteAdminDestination = await createDestination(
				airbyteAdminWorkspaceId,
				provider as 'rabbitmq' | 'google'
			);
			log('Created destination:', JSON.stringify(airbyteAdminDestination, null, '\t'));
			if (!airbyteAdminDestination.destinationId) {
				process.exit(1);
			}
		}

		//Set admin destination ID
		process.env.AIRBYTE_ADMIN_DESTINATION_ID = airbyteAdminDestination.destinationId;

		// Update webhook URLs
		const updatedWebhookUrls = await updateWebhookUrls(airbyteAdminWorkspaceId);
		log('UPDATED_WEBHOOK_URLS', JSON.stringify(updatedWebhookUrls));

		log('Overriding default ClientID and client secret for datasource OAuth integration');
		for (let provider in AIRBYTE_OAUTH_PROVIDERS) {
			const { clientId, clientSecret } = OauthSecretProviderFactory.getSecretProvider(
				provider.toLowerCase()
			);
			log(
				`Overriding ${provider.toLowerCase()} clientId and clientSecret to ${clientId} and ${clientSecret}`
			);
			overrideOauthCreds(airbyteAdminWorkspaceId, provider.toLowerCase(), clientId, clientSecret);
		}
	} catch (error) {
		logerror('Error during Airbyte configuration:', error);
	}
}
