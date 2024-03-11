'use strict';

import Permission from '@permission';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions';
import Roles from 'permissions/roles';

function calcPerms(req, res, next) {
	let calculatedPermissions;
	
	if (req.session && (req.session.accountId || req.session.passport?.user)) {
		//has a session and user, not anon, so their permissions from the db/user instead.
		const { user, matchingOrg, matchingTeam } = res.locals;
		const userPerms = user.permissions
			? typeof user.permissions !== 'string' ? user.permissions.toString('base64') : user.permissions
			: Math.max(...Object.values(Permissions)); //empty all false
		console.log('userPerms', userPerms);
		calculatedPermissions = new Permission(userPerms);
		if (matchingOrg && matchingOrg.ownerId.toString() === user._id.toString()) {
			calculatedPermissions.set(Permissions.ORG_OWNER);
		}
		
		if (matchingOrg && matchingOrg.ownerId.toString() === user._id.toString()) {
			// Setting  org owner perm
			calculatedPermissions.set(Permissions.ORG_OWNER);
		} else if (matchingTeam && matchingTeam.ownerId.toString() === user._id.toString()) {
			// Setting team owner perm
			calculatedPermissions.set(Permissions.TEAM_OWNER);
		} else if (matchingTeam && matchingTeam.permissions[user._id.toString()]) {
			// Setting all the bits of a users perms with their perms from the team they are a member of
			const teamPermissions = matchingTeam.permissions[user._id.toString()];
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
