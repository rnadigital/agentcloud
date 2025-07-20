import { createLogger } from 'utils/logger';
import { CollectionName } from 'lib/struct/db';
const log = createLogger('webapp:migration:1.11.0');

export default async function (db) {
	log.info('add indexes to checkpoints collection');
	await db.collection(CollectionName.Checkpoints).createIndex({ checkpoint_id: 1 });
	await db.collection(CollectionName.Checkpoints).createIndex({ thread_id: 1 });
}
