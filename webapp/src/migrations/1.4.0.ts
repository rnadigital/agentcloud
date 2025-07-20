import { CollectionName } from 'struct/db';
import { createLogger } from 'utils/logger';

const log = createLogger('webapp:migration:1.4.0');

export default async function (db) {
	log.info('creating index on sharelinks');
	await db.collection(CollectionName.ShareLinks).createIndex({ shareId: 1 });

	log.info('creating TTL index on sharelinks for payload.id null');
	await db
		.collection(CollectionName.ShareLinks)
		.createIndex(
			{ createdDate: 1 },
			{ expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { 'payload.id': null } }
		);
}
