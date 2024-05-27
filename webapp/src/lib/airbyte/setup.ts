import debug from 'debug';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Ensure node-fetch is installed or use a compatible fetch API
import path from 'path';

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
async function createDestination(workspaceId: string, provider: 'rabbitmq' | 'google') {
	const destinationConfiguration = getDestinationConfiguration(provider);
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

function getDestinationConfiguration(provider: 'rabbitmq' | 'google') {
	if (provider === 'rabbitmq') {
		return {
			routing_key: 'key',
			username: process.env.RABBITMQ_USERNAME || 'guest',
			password: process.env.RABBITMQ_PASSWORD || 'guest',
			exchange: 'agentcloud',
			port: process.env.RABBITMQ_PORT || 5672,
			host: process.env.RABBITMQ_HOST || '0.0.0.0',
			ssl: false
		};
	} else {
		return {
			project_id: process.env.PROJECT_ID,
			topic_id: process.env.QUEUE_NAME,
			credentials_json: process.env.GOOGLE_APPLICATION_CREDENTIALS,
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
		log('destinationsList: %O', destinationsList);

		let airbyteAdminDestinationId = destinationsList.destinations?.find(d => d?.destinationDefinition === destinationDefinitionId);
		log('AIRBYTE_ADMIN_DESTINATION_ID', airbyteAdminDestinationId);
		process.env.AIRBYTE_ADMIN_DESTINATION_ID = airbyteAdminDestinationId;

		if (!airbyteAdminDestinationId) {
			if (!provider) {
				console.error('Invalid process.env.MESSAGE_QUEUE_PROVIDER env value:', process.env.MESSAGE_QUEUE_PROVIDER);
				process.exit(1);
			}
			log(`Creating ${provider} destination`);
			const createdDestination = await createDestination(airbyteAdminWorkspaceId, provider as 'rabbitmq' | 'google');
			airbyteAdminDestinationId = createdDestination.destinationId;
			log('Created destination:', createdDestination);
		}

		// Update webhook URLs
		const updatedWebhookUrls = await updateWebhookUrls(airbyteAdminWorkspaceId);
		log('UPDATED_WEBHOOK_URLS', JSON.stringify(updatedWebhookUrls));

	} catch (error) {
		logerror('Error during Airbyte configuration:', error);
	}
}
