import debug from 'debug';
import { CollectionName } from 'lib/struct/db';
const log = debug('webapp:migration:1.11.0');

export default async function (db) {
	log('add indexes to checkpoints collection');
	await db.collection(CollectionName.Checkpoints).createIndex({ checkpoint_id: 1 });
	await db.collection(CollectionName.Checkpoints).createIndex({ thread_id: 1 });
}
