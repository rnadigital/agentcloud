import debug from 'debug';
const log = debug('webapp:migration:1.6.0');

export default async function (db) {
	log('Removing displayOnlyFinalOutput from all tasks');

	await db.collection('tasks').updateMany(
		{},
		{
			$unset: {
				displayOnlyFinalOutput: ''
			}
		}
	);
}
