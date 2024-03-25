import Permission from '@permission';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Permissions from 'permissions/permissions';

const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);

const NOT_LOGGED_IN = new Permission();

const REGISTERED_USER = new Permission();
REGISTERED_USER.setAll([Permissions.EDIT_ORG, Permissions.CREATE_TEAM, Permissions.EDIT_TEAM, Permissions.DELETE_TEAM]);

const ORG_ADMIN = new Permission();
ORG_ADMIN.setAll([Permissions.ORG_ADMIN, ...ORG_BITS]);
//TODO: various org roles

const TEAM_ADMIN = new Permission();
TEAM_ADMIN.setAll([Permissions.TEAM_ADMIN, ...TEAM_BITS]);
//TODO: various team roles

const Roles: any = Object.seal(Object.freeze(Object.preventExtensions({

	ROOT, NOT_LOGGED_IN, REGISTERED_USER,

	ORG_ADMIN, TEAM_ADMIN

})));

export default Roles;
