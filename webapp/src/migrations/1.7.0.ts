import { createLogger } from 'utils/logger';
const log = createLogger('webapp:migration:1.7.0');

export default async function (db) {
	log.info('Removing displayOnlyFinalOutput from all tasks');

	await db.collection('tasks').updateMany(
		{},
		{
			$unset: {
				displayOnlyFinalOutput: ''
			}
		}
	);
}
