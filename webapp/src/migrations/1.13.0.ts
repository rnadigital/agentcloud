import Permission from '@permission';
import debug from 'debug';
import { Binary } from 'mongodb';
import { TEAM_MEMBER } from 'permissions/roles';

const log = debug('webapp:migration:1.13.0');

export default async function updateTeamMemberPermissions(db) {
	log('adding variable permissions to team members');

	const teamMemberPermissions = new Permission();
	teamMemberPermissions.setAll(TEAM_MEMBER.array);

	// Retrieve only `_id` and `permissions` fields for efficiency
	const accounts = await db
		.collection('accounts')
		.find({}, { projection: { _id: 1, permissions: 1 } })
		.toArray();

	const teamMembersWithoutPermissionsIdArray = [];

	for (const account of accounts) {
		const accountPermissions = new Permission(account.permissions.buffer);

		const isTeamMember = TEAM_MEMBER.array.some(bit => accountPermissions.get(bit));
		if (!isTeamMember) {
			continue;
		}

		const hasAllTeamMemberPermissions = TEAM_MEMBER.array.every(bit => accountPermissions.get(bit));
		if (!hasAllTeamMemberPermissions) {
			teamMembersWithoutPermissionsIdArray.push(account._id);
		}
	}

	// Perform batch update for all team members missing required permissions
	if (teamMembersWithoutPermissionsIdArray.length > 0) {
		await db
			.collection('accounts')
			.updateMany(
				{ _id: { $in: teamMembersWithoutPermissionsIdArray } },
				{ $set: { permissions: new Binary(teamMemberPermissions.array) } }
			);
	}
}
