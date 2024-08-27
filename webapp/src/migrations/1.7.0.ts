import debug from 'debug';
import { CollectionName } from 'struct/db';
const log = debug('webapp:migration:1.7.0');

export default async function (db) {
	log(
		'adding a new index on datasources for "connectionId" so the enormous amount of queries from sync-server doesnt choke mongo'
	);
	await db.collection(CollectionName.Datasources).createIndex({ connectionId: 1 });
}
