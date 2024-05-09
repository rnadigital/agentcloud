

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: '.env' });
import debug from 'debug';
const log = debug('webapp:airbyte:setup');
const error = debug('webapp:airbyte:setup:error');
error.log = console.error.bind(console);

const authorizationHeader = 'Basic YWlyYnl0ZTpwYXNzd29yZA=='; //TODO: allow customisation

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
	const response = await fetch(`${process.env.AIRBYTE_API_URL}/v1/workspaces`, {
		headers: { Authorization: authorizationHeader }
	});
	return response.json();
}

// Function to fetch the destination list
async function fetchDestinationList(workspaceId) {
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
async function createDestination(workspaceId) {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/destinations/create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authorizationHeader
		},
		body: JSON.stringify({
			name: 'RabbitMQ',
			destinationDefinitionId: 'e06ad785-ad6f-4647-b2e8-3027a5c59454', //Note: rabbitmq destinaion id
			workspaceId,
			connectionConfiguration: { //TODO: creds for this??
				routing_key: 'key',
				username: 'guest',
				password: 'guest',
				exchange: 'agentcloud',
				port: 5672,
				host: '0.0.0.0',
				ssl: false
			}
		})
	});
	return response.json();
}

// Function to update webhook URLs
async function updateWebhookUrls(workspaceId) {
	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/workspaces/update`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authorizationHeader
		},
		body: JSON.stringify({
			workspaceId,
			notificationSettings: {
				// sendOnFailure: { notificationType: ['customerio', 'slack'] },
				sendOnSuccess: {
					notificationType: ['slack'],
					slackConfiguration: {
						webhook: 'http://webapp_next:3000/webhook/sync-successful'
					}
				},
				// sendOnConnectionUpdate: { notificationType: ['customerio', 'slack'] },
				// sendOnConnectionUpdateActionRequired: { notificationType: ['customerio', 'slack'] },
				// sendOnSyncDisabled: { notificationType: ['customerio', 'slack'] },
				// sendOnSyncDisabledWarning: { notificationType: ['customerio', 'slack'] },
				// sendOnBreakingChangeWarning: { notificationType: ['customerio'] },
				// sendOnBreakingChangeSyncsDisabled: { notificationType: ['customerio'] }
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
		const airbyteAdminWorkspaceId = workspacesList.data[0].workspaceId;

		log('AIRBYTE_ADMIN_WORKSPACE_ID', airbyteAdminWorkspaceId);

		// Get destination list
		const destinationsList = await fetchDestinationList(airbyteAdminWorkspaceId);
		let airbyteAdminDestinationId = destinationsList.destinations[0]?.destinationId;
		log('AIRBYTE_ADMIN_DESTINATION_ID', airbyteAdminDestinationId);

		if (!airbyteAdminDestinationId) {
			log('Creating destination');
			const createdDestination = await createDestination(airbyteAdminWorkspaceId);
			airbyteAdminDestinationId = createdDestination.destinationId;
			log('Created destination:', createdDestination);
		}

		// Update webhook URLs
		const updatedWebhookUrls = await updateWebhookUrls(airbyteAdminWorkspaceId);
		log('UPDATED_WEBHOOK_URLS', JSON.stringify(updatedWebhookUrls));

	} catch (error) {
		error('Error during Airbyte configuration:', error);
	}
}

