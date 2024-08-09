import debug from 'debug';
const log = debug('webapp:migration:1.5.0');
import { CollectionName } from 'struct/db';

export default async function (db) {
	log('add fullOutput: false to all existing crews');
	await db.collection(CollectionName.Crews).updateMany({}, { $set: { fullOutput: false } });
}
