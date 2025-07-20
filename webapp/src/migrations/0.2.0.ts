import { createLogger } from 'utils/logger';

const log = createLogger('webapp:migration:0.2.0');

export default async function (db) {
	log.info('Updating all existing "groups" in db to groupChat: true');
	await db.collection('groups').updateMany(
		{},
		{
			$set: {
				groupChat: true
			}
		}
	);
}
