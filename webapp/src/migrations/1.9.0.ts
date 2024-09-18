import debug from 'debug';
const log = debug('webapp:migration:1.9.0');

export default async function (db) {
	log('renaming chatAppConfig.recursionLimit to maxMessages');
	await db.collection('apps').updateMany(
		{},
		{
			$rename: {
				'chatAppConfig.recursionLimit': 'chatAppConfig.maxMessages'
			}
		}
	);
}
