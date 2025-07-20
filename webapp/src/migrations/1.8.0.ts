import { createLogger } from 'utils/logger';
import { CollectionName } from 'struct/db';
const log = createLogger('webapp:migration:1.8.0');

export default async function (db) {
	log.info(
		'adding a new index on datasources for "connectionId" so the enormous amount of queries from sync-server doesnt choke mongo'
	);
	await db.collection(CollectionName.Datasources).createIndex({ connectionId: 1 });
}
