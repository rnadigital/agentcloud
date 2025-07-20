import { createLogger } from 'utils/logger';

const log = createLogger('webapp:migration:1.13.0');

export default async function (db) {
	log.info('Starting stripe data migration from accounts to orgs');

	const orgs = await db.collection('orgs').find({}).toArray();
	log.info(`Found ${orgs.length} organizations to process`);

	let migratedCount = 0;
	let errorCount = 0;

	for (const org of orgs) {
		try {
			const ownerAccount = await db.collection('accounts').findOne({
				_id: org.ownerId
			});

			if (!ownerAccount) {
				log.warn(`No owner account found for org ${org._id}`);
				continue;
			}

			if (!ownerAccount.stripe) {
				log.warn(`No stripe data found for owner of org ${org._id}`);
				continue;
			}

			await db.collection('orgs').updateOne(
				{ _id: org._id },
				{
					$set: {
						stripe: ownerAccount.stripe
					}
				}
			);

			await db.collection('accounts').updateOne(
				{ _id: ownerAccount._id },
				{
					$unset: {
						stripe: ''
					}
				}
			);

			migratedCount++;
			log.info(`Successfully migrated stripe data for org ${org._id}`);
		} catch (error) {
			errorCount++;
			log.error(`Error processing org ${org._id}: ${error.message}`);
		}
	}

	const result = await db.collection('accounts').updateMany(
		{ stripe: { $exists: true } },
		{
			$unset: {
				stripe: ''
			}
		}
	);

	log.info(
		`Migration complete. Successfully migrated ${migratedCount} orgs. Errors: ${errorCount}`
	);
	log.info(`Cleaned up stripe data from ${result.modifiedCount} remaining accounts`);
}
