'use strict';

import Permission from '@permission';
import { Metadata, Permissions, Role } from 'permissions/metadata';

export default function checkPermissions(req, res, next) {

	let calculatedPermissions;

	if (req.session && res.locals && res.locals.user) {

		//has a session and user, not anon, so their permissions from the db/user instead.
		const { user } = res.locals;
		calculatedPermissions = new Permission(user.permissions);

		//TODO: check if an org owner and set ORG_OWNER, team owner set TEAM OWNER, etc

		//apply inheritances
		calculatedPermissions.applyInheritance();

	} else {
		// not logged in
		calculatedPermissions = new Permission(Role.NOT_LOGGED_IN.base64);
	}

	return calculatedPermissions;

}
