'use strict';

import Permission from '@permission';
import Metadata from 'permissions/metadata';
import Permissions, { ORG_BITS, TEAM_BITS } from 'permissions/permissions';
import Roles from 'permissions/roles';

export default function checkPermission(req, res, next) {
	let calculatedPermissions;
	if (req.session && res.locals && res.locals.user) {
		//has a session and user, not anon, so their permissions from the db/user instead.
		const { user, matchingOrg, matchingTeam } = res.locals;
		const userPerms = typeof user.permissions !== 'string' ? user.permissions.toString('base64') : user.permissions;
		calculatedPermissions = new Permission(userPerms);

		if (matchingOrg && matchingOrg.ownerId.toString() === user._id.toString()) {
			calculatedPermissions.set(Permissions.ORG_OWNER);
		}

		if (matchingOrg && matchingOrg.ownerId.toString() === user._id.toString()) {
			calculatedPermissions.set(Permissions.ORG_OWNER);
		} else if (matchingTeam && matchingTeam.ownerId.toString() === user._id.toString()) {
			calculatedPermissions.set(Permissions.TEAM_OWNER);
		} else if (matchingTeam && matchingTeam.permissions[user._id.toString()]) {
			const teamPermissions = matchingTeam.permissions[user._id.toString()];
			for (let bit of TEAM_BITS) {
				console.log(bit);
				// const inheritOr = calculatedPermissions.get(bit) || boardPermissions.get(bit);
				// calculatedPermissions.set(bit, inheritOrGlobal);
			}
			
		}

		//apply inheritances
		calculatedPermissions.applyInheritance();
	} else {
		// not logged in
		// calculatedPermissions = new Permission(Role.NOT_LOGGED_IN.base64);
	}

	return calculatedPermissions;

}
