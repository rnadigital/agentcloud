'use strict';

import Permission from '@permission';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions';
import Roles from 'permissions/roles';

function calcPerms(req, res, next) {
	let calculatedPermissions;
	if (req.session && res.locals && res.locals.account) {
		//has a session and user, not anon, so their permissions from the db/user instead.
		const { account, matchingOrg, matchingTeam } = res.locals;

		const userPerms = account.permissions
			? typeof account.permissions !== 'string' ? account.permissions.toString('base64') : account.permissions
			: Math.max(...Object.values(Permissions)); //full size empty

		console.log('userPerms', userPerms);
		calculatedPermissions = new Permission(userPerms);
		calculatedPermissions.set(Permissions.EDIT_TEAM_MEMBER);
		console.log('account, matchingOrg, matchingTeam', account, matchingOrg, matchingTeam);
		
		if (matchingOrg && matchingOrg.ownerId.toString() === account._id.toString()) {
			// Setting  org owner perm
			calculatedPermissions.set(Permissions.ORG_OWNER);
		} else if (matchingTeam && matchingTeam.ownerId.toString() === account._id.toString()) {
			// Setting team owner perm
			calculatedPermissions.set(Permissions.TEAM_OWNER);
		} else if (matchingTeam && matchingTeam.permissions[account._id.toString()]) {
			// Setting all the bits of a users perms with their perms from the team they are a member of
			const teamPermissions = matchingTeam.permissions[account._id.toString()];
			for (let bit of TEAM_BITS) {
				calculatedPermissions.set(bit, teamPermissions.get(bit));
			}
		}
		
		// Apply inheritance, see Permission
		calculatedPermissions.applyInheritance();
		
	} else {
		// Unauthenticated users have no perms (except e.g. CREATE_ACCOUNT if we do that)
		calculatedPermissions = new Permission(Math.max(...Object.values(Permissions)));
	}
	return calculatedPermissions;
}

export default function setPermissions(req, res, next) {
	res.locals.permissions = calcPerms(req, res, next);
	next();
};
