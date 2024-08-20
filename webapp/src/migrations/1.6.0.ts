import debug from 'debug';
const log = debug('webapp:migration:1.6.0');

export default async function (db) {
	log('Updating all sourceType: file datasources to new unstructured.io configs');
	//NOTE: we don't use libs here e.g. SubscriptionPlan.RAW because that struct could change/not be importable anymore. all has to be encapsulated
	await db.collection('datasources').updateMany(
		{
			sourceType: 'file'
		},
		{
			$unset: {
				chunkingStrategy: '',
				chunkingCharacter: ''
			},
			$set: {
				chunkingConfig: {
					partitioning: 'auto',
					strategy: 'basic',
					max_characters: 500,
					new_after_n_chars: 500,
					overlap: 0,
					similarity_threshold: 0.5,
					overlap_all: false
				}
			}
		}
	);
}
