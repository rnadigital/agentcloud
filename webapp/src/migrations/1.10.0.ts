import debug from 'debug';
const log = debug('webapp:migration:1.10.0');

export default async function (db) {
	log('set empty ragFilters on all existing tools');
	await db.collection('tools').updateMany(
		{
			type: 'rag',
			ragFilter: {
				$exists: false
			}
		},
		{
			$set: {
				ragFilters: {}
			}
		}
	);
	log('adding variableIds to all tasks and agents');
	await db.collection('tasks').updateMany(
		{ variableIds: { $exists: false } },
		{
			$set: {
				variableIds: []
			}
		}
	);
	await db.collection('agents').updateMany(
		{ variableIds: { $exists: false } },
		{
			$set: {
				variableIds: []
			}
		}
	);
}
