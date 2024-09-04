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

import { getAirbyteAuthToken } from 'airbyte/api';
import { parse } from 'ip6addr';
import SecretProviderFactory from 'lib/secret';

dotenv.config({ path: '.env' });

const log = debug('webapp:airbyte:setup');

// Note: is there an idiomatic way to do this?
const logdebug = debug('webapp:airbyte:setup:debug');
logdebug.log = console.debug.bind(console);
const logerror = debug('webapp:airbyte:setup:error');
logerror.log = console.error.bind(console);

const authorizationHeader = `Basic ${Buffer.from(`${process.env.AIRBYTE_USERNAME.trim()}:${process.env.AIRBYTE_PASSWORD.trim()}`).toString('base64')}`;
const provider = process.env.MESSAGE_QUEUE_PROVIDER;
export const destinationDefinitionId =
	provider === 'rabbitmq'
		? 'e06ad785-ad6f-4647-b2e8-3027a5c59454' // RabbitMQ destination id
		: '356668e2-7e34-47f3-a3b0-67a8a481b692'; // Google Pub/Sub destination id

// Function to fetch instance configuration
async function fetchInstanceConfiguration() {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/instance_configuration`, {
		headers: { Authorization: authorizationHeader }
	});
	if (!response || response.status !== 200) {
		log('Unable to fetch airbyte instance configuration, waiting & restarting...');
		await new Promise(res => setTimeout(res, 60000));
		process.exit(1);
	}
	return response.json();
}

// Function to skip the setup screen
async function skipSetupScreen() {
	const response = await fetch(
		`${process.env.AIRBYTE_WEB_URL}/api/v1/instance_configuration/setup`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authorizationHeader
			},
			body: JSON.stringify({
				email: 'example@example.org',
				anonymousDataCollection: false,
				securityCheck: 'ignored',
				organizationName: 'example',
				initialSetupComplete: true,
				displaySetupWizard: false
			})
		}
	);
	return response.json();
}

// Function to fetch workspaces
async function fetchWorkspaces() {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/public/v1/workspaces`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${await getAirbyteAuthToken()}` }
	});
	return response.json();
}

// Function to fetch applications
async function fetchApplications() {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/public/v1/applications`, {
		method: 'GET',
		headers: { Authorization: authorizationHeader }
	});
	return response.json();
}

// Function to fetch applications
export async function listLatestSourceDefinitions() {
	const response = await fetch(
		`${process.env.AIRBYTE_WEB_URL}/api/v1/source_definitions/list_latest`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${await getAirbyteAuthToken()}`
			}
		}
	);
	return response.json();
}

// Function to fetch the destination list
async function fetchDestinationList(workspaceId: string) {
	const response = await fetch(
		`${process.env.AIRBYTE_WEB_URL}/api/public/v1/destinations?workspaceId=${encodeURIComponent(workspaceId)}`,
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
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/public/v1/destinations`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${await getAirbyteAuthToken()}`
		},
		body: JSON.stringify({
			name: provider === 'rabbitmq' ? 'RabbitMQ' : 'Google Pub/Sub',
			destinationDefinitionId,
			workspaceId,
			connectionConfiguration: destinationConfiguration
		})
	});
	return response.json();
}

// Function to deletea destination
async function deleteDestination(destinationId: string) {
	const response = await fetch(
		`${process.env.AIRBYTE_WEB_URL}/api/public/v1/destinations/${destinationId}`,
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
		try {
			//Note: just parsing to see if it throws, we don't need to actually know the ip kind
			const ipParsed = parse(host);
			const ipKind = ipParsed.kind();
		} catch (e) {
			// host = (await lookup(host, { family: 4 }))?.address;
			// if (!host) {
			// 	log(
			// 		'Error getting host in getDestinationConfiguration host: %s, process.env.AIRBYTE_RABBITMQ_HOST: %s',
			// 		host,
			// 		process.env.AIRBYTE_RABBITMQ_HOST
			// 	);
			// }
		}
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
			log('credentialsContent %s', credentialsPath);
			credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
			if (!credentialsContent) {
				log(
					'Failed to read content of process.env.GOOGLE_APPLICATION_CREDENTIALS file at path: %s',
					process.env.GOOGLE_APPLICATION_CREDENTIALS
				);
				process.exit(1);
			}
		} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
			log(
				'process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON %s',
				process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
			);
			credentialsContent = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
		} else {
			log('google application credentials missing private_key, fetching from secret store');
			const secretProvider = SecretProviderFactory.getSecretProvider('google');
			await secretProvider.init();
			const googleCreds = await secretProvider.getSecret('GOOGLE_APPLICATION_CREDENTIAL');
			credentialsContent = googleCreds;
		}

		log('credentialsContent %O', credentialsContent);
		console.log('=== credentialsContent %O', credentialsContent);
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
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/workspaces/update`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authorizationHeader
		},
		body: JSON.stringify({
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
		})
	});
	return response.json();
}

// Main logic to handle Airbyte setup and configuration
export async function init() {
	try {
		if (!process.env.AIRBYTE_CLIENT_ID || !process.env.AIRBYTE_CLIENT_SERET) {
			const existingApplications = await fetchApplications();
			log('existingApplications', existingApplications);
			const defaultApplication = existingApplications.applications.find(
				app => app?.name === 'Default User Application'
			);
			if (!defaultApplication) {
				log(
					'AIRBYTE_CLIENT_ID or AIRBYTE_CLIENT_SECRET not set and default application not found in airbyte api'
				);
				process.exit(1);
			}
			process.env.AIRBYTE_CLIENT_ID = defaultApplication.clientId;
			process.env.AIRBYTE_CLIENT_SECRET = defaultApplication.clientSecret;
		}

		log(
			'airbyte creds, %s, %s',
			process.env.AIRBYTE_USERNAME.trim(),
			process.env.AIRBYTE_PASSWORD.trim()
		);

		// Get instance configuration
		const instanceConfiguration = await fetchInstanceConfiguration();
		log('instanceConfiguration', instanceConfiguration);

		const initialSetupComplete = instanceConfiguration.initialSetupComplete;

		log('INITIAL_SETUP_COMPLETE', initialSetupComplete);

		if (!initialSetupComplete) {
			log('Skipping airbyte setup screen...');
			await skipSetupScreen();
		}

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
			const configMismatch = Object.keys(newConfig).some(key => {
				if (currentConfig && currentConfig[key] === '**********') {
					//hidden fields
					return false; // Skip password/credentials json comparison
				}
				return currentConfig && currentConfig[key] !== newConfig[key];
			});
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
	} catch (error) {
		logerror('Error during Airbyte configuration:', error);
	}
}
