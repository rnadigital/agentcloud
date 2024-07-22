import debug from 'debug';
const log = debug('webapp:migration:0.2.0');

export default async function (db) {
	log('Updating all existing "groups" in db to groupChat: true');
	await db.collection('groups').updateMany(
		{},
		{
			$set: {
				groupChat: true
			}
		}
	);
}
