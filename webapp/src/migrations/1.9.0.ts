import { createLogger } from 'utils/logger';
const log = createLogger('webapp:migration:1.9.0');

export default async function (db) {
	log.info('renaming chatAppConfig.recursionLimit to maxMessages');
	await db.collection('apps').updateMany(
		{},
		{
			$rename: {
				'chatAppConfig.recursionLimit': 'chatAppConfig.maxMessages'
			}
		}
	);
}
