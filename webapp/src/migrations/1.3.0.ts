import debug from 'debug';
const log = debug('webapp:migration:1.3.0');
import { CollectionName } from 'struct/db';

export default async function (db) {
	log('Adding database indexes');
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
			log(`Created index on teamId for collection: ${collection}`);
		} catch (error) {
			log(`Error creating index on teamId for collection: ${collection} - ${error.message}`);
		}
	}
}
