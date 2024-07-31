import debug from 'debug';
const log = debug('webapp:migration:1.4.0');
import { CollectionName } from 'struct/db';

export default async function (db) {
	log('creating index on sharelinks');
	await db.collection(CollectionName.ShareLinks).createIndex({ shareId: 1 });

	log('creating TTL index on sharelinks for payload.id null');
	await db
		.collection(CollectionName.ShareLinks)
		.createIndex(
			{ createdDate: 1 },
			{ expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { 'payload.id': null } }
		);
}
