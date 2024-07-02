diff --git a/webapp/src/lib/airbyte/setup.ts b/webapp/src/lib/airbyte/setup.ts
index 0c5debe..0985af3 100644
--- a/webapp/src/lib/airbyte/setup.ts
+++ b/webapp/src/lib/airbyte/setup.ts
@@ -75,7 +75,7 @@ async function fetchDestinationList(workspaceId: string) {
 }
 
 // Function to create a destination
-async function createDestination(workspaceId: string, provider: 'rabbitmq' | 'google') {
+async function createDestination(workspaceId: string, provider: string) {
 	const destinationConfiguration = await getDestinationConfiguration(provider);
 	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/destinations/create`, {
 		method: 'POST',
@@ -93,14 +93,28 @@ async function createDestination(workspaceId: string, provider: 'rabbitmq' | 'go
 	return response.json();
 }
 
-async function getDestinationConfiguration(provider: 'rabbitmq' | 'google') {
+// Function to deletea destination
+async function deleteDestination(destinationId: string) {
+	const response = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/destinations/delete`, {
+		method: 'DELETE',
+		headers: {
+			'Content-Type': 'application/json',
+			Authorization: authorizationHeader
+		},
+		body: JSON.stringify({
+			destinationId,
+		}),
+	});
+}
+
+async function getDestinationConfiguration(provider: string) {
 	if (provider === 'rabbitmq') {
 		return {
 			routing_key: 'key',
 			username: process.env.RABBITMQ_USERNAME || 'guest',
 			password: process.env.RABBITMQ_PASSWORD || 'guest',
 			exchange: 'agentcloud',
-			port: process.env.RABBITMQ_PORT || 5672,
+			port: parseInt(process.env.RABBITMQ_PORT) || 5672,
 			host: process.env.RABBITMQ_HOST || '0.0.0.0',
 			ssl: false
 		};
@@ -192,7 +206,27 @@ export async function init() {
 		let airbyteAdminDestination = destinationsList.destinations?.find(d => d?.destinationDefinitionId === destinationDefinitionId);
 		log('AIRBYTE_ADMIN_DESTINATION_ID', airbyteAdminDestination?.destinationId);
 
-		if (!airbyteAdminDestination) {
+		if (airbyteAdminDestination) {
+			const currentConfig = airbyteAdminDestination.connectionConfiguration;
+			const newConfig = await getDestinationConfiguration(provider);
+			const configMismatch = Object.keys(newConfig).some(key => {
+				if (currentConfig[key] === '**********') { //hidden fields
+					return false; // Skip password/credentials json comparison
+				}
+				return currentConfig[key] !== newConfig[key];
+			});
+			if (configMismatch) {
+				log('Destination configuration mismatch detected, delete and recreate the destination.');
+				await deleteDestination(airbyteAdminDestination?.destinationId);
+				airbyteAdminDestination = await createDestination(airbyteAdminWorkspaceId, provider);
+				log('Created destination:', JSON.stringify(airbyteAdminDestination, null, '\t'));
+				if (!airbyteAdminDestination.destinationId) {
+					log('Failed to create new destination with updated config');
+					log(airbyteAdminDestination);
+					process.exit(1);
+				}
+			}
+		} else {
 			if (!provider) {
 				console.error('Invalid process.env.MESSAGE_QUEUE_PROVIDER env value:', process.env.MESSAGE_QUEUE_PROVIDER);
 				process.exit(1);
				