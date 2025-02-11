import debug from 'debug';

const log = debug('webapp:migration:1.14.0');

export default async function (db) {
	log('Starting vectordb type migration for datasources');

	const datasources = await db
		.collection('datasources')
		.find({
			vectorDbId: { $exists: true }
		})
		.toArray();

	log(`Found ${datasources.length} datasources with vectorDbId to process`);

	let vectorDbMigratedCount = 0;
	let vectorDbErrorCount = 0;

	for (const datasource of datasources) {
		try {
			const vectorDb = await db.collection('vectordbs').findOne({
				_id: datasource.vectorDbId
			});

			if (!vectorDb) {
				log(`No vectordb found for datasource ${datasource._id}`);
				continue;
			}

			await db.collection('datasources').updateOne(
				{ _id: datasource._id },
				{
					$set: {
						vectordbtype: vectorDb.type
					}
				}
			);

			vectorDbMigratedCount++;
			log(`Successfully added vectordbtype for datasource ${datasource._id}`);
		} catch (error) {
			vectorDbErrorCount++;
			log(`Error processing datasource ${datasource._id}: ${error.message}`);
		}
	}

	log(
		`VectorDB type migration complete. Successfully migrated ${vectorDbMigratedCount} datasources. Errors: ${vectorDbErrorCount}`
	);
}
