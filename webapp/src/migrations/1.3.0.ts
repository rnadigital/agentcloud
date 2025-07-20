import { CollectionName } from 'struct/db';
import { createLogger } from 'utils/logger';

const log = createLogger('webapp:migration:1.3.0');

export default async function (db) {
	log.info('Adding database indexes');
	const collections = [
		CollectionName.Accounts,
		CollectionName.Agents,
		CollectionName.Apps,
		CollectionName.Chat,
		CollectionName.Crews,
		CollectionName.Datasources,
		CollectionName.Notifications,
		CollectionName.Orgs,
		CollectionName.Tasks,
		CollectionName.Teams,
		CollectionName.Tools,
		CollectionName.Toolrevisions,
		CollectionName.Sessions
	];

	for (const collection of collections) {
		try {
			await db.collection(collection).createIndex({ teamId: 1 });
			log.info(`Created index on teamId for collection: ${collection}`);
		} catch (error) {
			log.error(`Error creating index on teamId for collection: ${collection} - ${error.message}`);
		}
	}
}
