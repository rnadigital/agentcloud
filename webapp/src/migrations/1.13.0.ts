import Permission from '@permission';
import debug from 'debug';
import { Binary } from 'mongodb';
import { TEAM_MEMBER } from 'permissions/roles';

const log = debug('webapp:migration:1.13.0');

export default async function updateTeamMemberPermissions(db) {
	log('add variable permissions to team members');
	const teamMemberPermissions = new Permission();
	teamMemberPermissions.setAll(TEAM_MEMBER.array);
	const accounts = await db.collection('accounts').find().toArray();
	for (const account of accounts) {
		const accountPermissions = new Permission(account.permissions.buffer);
		const isTeamMember = TEAM_MEMBER.array.some(bit => accountPermissions.get(bit));
		if (!isTeamMember) {
			continue;
		}
		const hasAllTeamMemberPermissions = TEAM_MEMBER.array.every(bit => accountPermissions.get(bit));
		if (!hasAllTeamMemberPermissions) {
			accountPermissions.setAll(teamMemberPermissions.array);
			await db
				.collection('accounts')
				.updateOne(
					{ _id: account._id },
					{ $set: { permissions: new Binary(accountPermissions.array) } }
				);
		}
	}
}
