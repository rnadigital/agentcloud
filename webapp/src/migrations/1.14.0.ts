import { createLogger } from 'utils/logger';

const log = createLogger('webapp:migration:1.14.0');

export default async function (db) {
	log.info('Starting vectordb type migration for datasources');

	const datasources = await db
		.collection('datasources')
		.find({
			vectorDbId: { $exists: true }
		})
		.toArray();

	log.info(`Found ${datasources.length} datasources with vectorDbId to process`);

	let vectorDbMigratedCount = 0;
	let vectorDbErrorCount = 0;

	for (const datasource of datasources) {
		try {
			const vectorDb = await db.collection('vectordbs').findOne({
				_id: datasource.vectorDbId
			});

			if (!vectorDb) {
				log.warn(`No vectordb found for datasource ${datasource._id}`);
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
			log.info(`Successfully added vectordbtype for datasource ${datasource._id}`);
		} catch (error) {
			vectorDbErrorCount++;
			log.error(`Error processing datasource ${datasource._id}: ${error.message}`);
		}
	}

	log.info(
		`VectorDB type migration complete. Successfully migrated ${vectorDbMigratedCount} datasources. Errors: ${vectorDbErrorCount}`
	);
}
