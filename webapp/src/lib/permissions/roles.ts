import Permission from '@permission';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Permissions from 'permissions/permissions';

const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);

const NOT_LOGGED_IN = new Permission();

const TESTING = new Permission();
TESTING.setAll([Permissions.TESTING]);

const ORG_OWNER = new Permission();
ORG_OWNER.setAll([Permissions.ORG_OWNER, ...ORG_BITS]);

const TEAM_OWNER = new Permission();
TEAM_OWNER.setAll([Permissions.TEAM_OWNER, ...TEAM_BITS]);

const Roles: any = Object.seal(Object.freeze(Object.preventExtensions({

	ROOT, NOT_LOGGED_IN, TESTING,

	ORG_OWNER, TEAM_OWNER

})));

export default Roles;
