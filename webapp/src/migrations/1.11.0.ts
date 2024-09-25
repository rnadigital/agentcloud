import Permission from '@permission';
import debug from 'debug';
import { Binary, ObjectId } from 'mongodb';
import { TeamRoles } from 'permissions/roles';

const log = debug('webapp:migration:1.10.0');

export default async function (db) {
	log('unsetting all account level perms');
	const blankPermission = new Permission();
	await db.collection('accounts').updateMany(
		{},
		{
			$set: {
				permissions: new Binary(blankPermission.array)
			}
		}
	);

	log('setting all accounts team permissions to be TEAM_MEMBER');
	const accounts = await db.collection('accounts').find().toArray();

	const teamMemberPermission = new Binary(new Permission(TeamRoles.TEAM_MEMBER.base64).array);

	const bulkWrites = [];

	for (const account of accounts) {
		if (!account.orgs || account.orgs.length === 0) continue;

		for (const org of account.orgs) {
			if (!org.teams || org.teams.length === 0) continue;

			for (const team of org.teams) {
				bulkWrites.push({
					updateOne: {
						filter: { _id: new ObjectId(team.id) },
						update: {
							$set: {
								[`permissions.${account._id}`]: teamMemberPermission
							}
						}
					}
				});
			}
		}
	}

	if (bulkWrites.length > 0) {
		log('executing bulk write for teams');
		await db.collection('teams').bulkWrite(bulkWrites);
	} else {
		log('no teams to update');
	}
}
