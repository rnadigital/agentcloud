'use strict';

import Permission from '@permission';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions';
import Roles from 'permissions/roles';

export default function checkPermission(req, res, next) {
	let calculatedPermissions;
	console.log(Metadata, Permissions, Roles, Permission);

	if (req.session && res.locals && res.locals.user) {

		//has a session and user, not anon, so their permissions from the db/user instead.
		const { user } = res.locals;
		calculatedPermissions = new Permission(user.permissions);

		//TODO: check if an org owner and set ORG_OWNER, team owner set TEAM_OWNER, etc

		//apply inheritances
		calculatedPermissions.applyInheritance();

	} else {
		// not logged in
		// calculatedPermissions = new Permission(Role.NOT_LOGGED_IN.base64);
	}

	return calculatedPermissions;

}
