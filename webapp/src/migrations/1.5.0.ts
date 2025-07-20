import { createLogger } from 'utils/logger';
const log = createLogger('webapp:migration:1.5.0');
import { CollectionName } from 'struct/db';

export default async function (db) {
	log.info('add fullOutput: false to all existing crews');
	await db.collection(CollectionName.Crews).updateMany({}, { $set: { fullOutput: false } });
}
