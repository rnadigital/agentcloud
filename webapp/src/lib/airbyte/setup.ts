import debug from 'debug';
import dotenv from 'dotenv';
import fs from 'fs';
import getGoogleCredentials from 'misc/getgooglecredentials';
import fetch from 'node-fetch'; // Ensure node-fetch is installed or use a compatible fetch API
import path from 'path';
const { GoogleAuth } = require('google-auth-library');

import SecretProviderFactory from 'lib/secret';

dotenv.config({ path: '.env' });

const log = debug('webapp:airbyte:setup');

// Note: is there an idiomatic way to do this?
const logdebug = debug('webapp:airbyte:setup:debug');
logdebug.log = console.debug.bind(console);
const logerror = debug('webapp:airbyte:setup:error');
logerror.log = console.error.bind(console);

const authorizationHeader = `Basic ${Buffer.from(`${process.env.AIRBYTE_USERNAME}:${process.env.AIRBYTE_PASSWORD}`).toString('base64')}`;
const provider = process.env.MESSAGE_QUEUE_PROVIDER;
const destinationDefinitionId = provider === 'rabbitmq'
	? 'e06ad785-ad6f-4647-b2e8-3027a5c59454' // RabbitMQ destination id
	: '356668e2-7e34-47f3-a3b0-67a8a481b692'; // Google Pub/Sub destination id

// Function to fetch instance configuration
async function fetchInstanceConfiguration() {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/instance_configuration`, {
		headers: { Authorization: authorizationHeader }
	});
	return response.json();
}

// Function to skip the setup screen
async function skipSetupScreen() {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/instance_configuration/setup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authorizationHeader
		},
		body: JSON.stringify({
			email: 'example@example.org',
			anonymousDataCollection: false,
			securityCheck: 'succeeded',
			organizationName: 'example',
			initialSetupComplete: true,
			displaySetupWizard: false
		})
	});
	return response.json();
}

// Function to fetch workspaces
async function fetchWorkspaces() {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/workspaces/list`, {
		method: 'POST',
		headers: { Authorization: authorizationHeader }
	});
	return response.json();
}

// Function to fetch the destination list
async function fetchDestinationList(workspaceId: string) {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/destinations/list`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authorizationHeader
		},
		body: JSON.stringify({ workspaceId })
	});
	return response.json();
}

// Function to create a destination
async function createDestination(workspaceId: string, provider: string) {
	const destinationConfiguration = await getDestinationConfiguration(provider);
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/destinations/create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authorizationHeader
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
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/destinations/delete`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authorizationHeader
		},
		body: JSON.stringify({
			destinationId,
		}),
	});
}

async function getDestinationConfiguration(provider: string) {
	if (provider === 'rabbitmq') {
		return {
			routing_key: 'key',
			username: process.env.RABBITMQ_USERNAME || 'guest',
			password: process.env.RABBITMQ_PASSWORD || 'guest',
			exchange: 'agentcloud',
			port: parseInt(process.env.RABBITMQ_PORT) || 5672,
			host: process.env.RABBITMQ_HOST || '0.0.0.0',
			ssl: false
		};
	} else {
		let credentialsContent;
		if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
			if (!credentialsPath) {
				log('missing GOOGLE_APPLICATION_CREDENTIALS path, current value: %s', process.env.GOOGLE_APPLICATION_CREDENTIALS);
				process.exit(1);
			}
			log('credentialsContent %s', credentialsPath);
			credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
			if (!credentialsContent) {
				log('Failed to read content of process.env.GOOGLE_APPLICATION_CREDENTIALS file at path: %s', process.env.GOOGLE_APPLICATION_CREDENTIALS);
				process.exit(1);
			}
		} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
			log('process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON %s', process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
			credentialsContent = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
		} else {
			log('google application credentials missing private_key, fetching from secret store');
			const secretProvider = SecretProviderFactory.getSecretProvider('google');
			await secretProvider.init();
			const googleCreds = await secretProvider.getSecret('GOOGLE_APPLICATION_CREDENTIAL');
			credentialsContent = googleCreds;
		}

		log('credentialsContent %O', credentialsContent);
		return {
			project_id: process.env.PROJECT_ID,
			topic_id: process.env.QUEUE_NAME,
			credentials_json: credentialsContent,
			ordering_enabled: false,
			batching_enabled: false,
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
						webhook: 'http://webapp_next:3000/webhook/sync-successful'
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
		// Get instance configuration
		const instanceConfiguration = await fetchInstanceConfiguration();
		const initialSetupComplete = instanceConfiguration.initialSetupComplete;

		log('INITIAL_SETUP_COMPLETE', initialSetupComplete);

		if (!initialSetupComplete) {
			log('Skipping airbyte setup screen...');
			await skipSetupScreen();
		}

		// Get workspaces
		const workspacesList = await fetchWorkspaces();
		log('workspacesList: %O', workspacesList);
		const airbyteAdminWorkspaceId = workspacesList.workspaces[0].workspaceId;

		log('AIRBYTE_ADMIN_WORKSPACE_ID', airbyteAdminWorkspaceId);
		process.env.AIRBYTE_ADMIN_WORKSPACE_ID = airbyteAdminWorkspaceId;

		// Get destination list
		const destinationsList = await fetchDestinationList(airbyteAdminWorkspaceId);
		log('destinationsList: %s', JSON.stringify(destinationsList, null, '\t'));

		let airbyteAdminDestination = destinationsList.destinations?.find(d => d?.destinationDefinitionId === destinationDefinitionId);
		log('AIRBYTE_ADMIN_DESTINATION_ID', airbyteAdminDestination?.destinationId);

		if (airbyteAdminDestination) {
			const currentConfig = airbyteAdminDestination.connectionConfiguration;
			const newConfig = await getDestinationConfiguration(provider);
			const configMismatch = Object.keys(newConfig).some(key => {
				if (currentConfig[key] === '**********') { //hidden fields
					return false; // Skip password/credentials json comparison
				}
				return currentConfig[key] !== newConfig[key];
			});
			if (configMismatch) {
				log('Destination configuration mismatch detected, delete and recreate the destination.');
				await deleteDestination(airbyteAdminDestination?.destinationId);
				airbyteAdminDestination = await createDestination(airbyteAdminWorkspaceId, provider);
				log('Created destination:', JSON.stringify(airbyteAdminDestination, null, '\t'));
				if (!airbyteAdminDestination.destinationId) {
					log('Failed to create new destination with updated config');
					log(airbyteAdminDestination);
					process.exit(1);
				}
			}
		} else {
			if (!provider) {
				console.error('Invalid process.env.MESSAGE_QUEUE_PROVIDER env value:', process.env.MESSAGE_QUEUE_PROVIDER);
				process.exit(1);
			}
			log(`Creating ${provider} destination`);
			airbyteAdminDestination = await createDestination(airbyteAdminWorkspaceId, provider as 'rabbitmq' | 'google');
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
