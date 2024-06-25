import Permission from '@permission';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Permissions from 'permissions/permissions';

const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);

const NOT_LOGGED_IN = new Permission();

const REGISTERED_USER = new Permission();
REGISTERED_USER.setAll([Permissions.EDIT_ORG, Permissions.CREATE_TEAM, Permissions.EDIT_TEAM, Permissions.DELETE_TEAM]);

const ORG_ADMIN = new Permission();
ORG_ADMIN.setAll([
	Permissions.CREATE_TEAM,
	Permissions.EDIT_TEAM,
	Permissions.DELETE_TEAM,
]);

const TEAM_MEMBER = new Permission();
TEAM_MEMBER.setAll([
	// Permissions.ADD_TEAM_MEMBER,
	// Permissions.EDIT_TEAM_MEMBER,
	// Permissions.REMOVE_TEAM_MEMBER,
	Permissions.CREATE_APP,
	Permissions.EDIT_APP,
	Permissions.DELETE_APP,
	Permissions.CREATE_DEPLOYMENT,
	Permissions.EDIT_DEPLOYMENT,
	Permissions.DELETE_DEPLOYMENT,
	Permissions.CREATE_AGENT,
	Permissions.EDIT_AGENT,
	Permissions.DELETE_AGENT,
	Permissions.CREATE_MODEL,
	Permissions.EDIT_MODEL,
	Permissions.DELETE_MODEL,
	Permissions.CREATE_TASK,
	Permissions.EDIT_TASK,
	Permissions.DELETE_TASK,
	Permissions.CREATE_TOOL,
	Permissions.EDIT_TOOL,
	Permissions.DELETE_TOOL,
	Permissions.CREATE_DATASOURCE,
	Permissions.EDIT_DATASOURCE,
	Permissions.SYNC_DATASOURCE,
	Permissions.DELETE_DATASOURCE,
	Permissions.UPLOAD_ASSET,
	Permissions.DELETE_ASSET
]);

const TEAM_ADMIN = new Permission();
TEAM_ADMIN.setAll(TEAM_BITS);

const Roles: any = Object.seal(Object.freeze(Object.preventExtensions({

	ROOT, NOT_LOGGED_IN, REGISTERED_USER,

	ORG_ADMIN, TEAM_MEMBER, TEAM_ADMIN

})));

export type RoleKey = keyof typeof Roles;

export const RoleOptions = [
	{ label: 'Team Member', value: 'TEAM_MEMBER' },
	{ label: 'Team Admin', value: 'TEAM_ADMIN' }
];

export default Roles;

