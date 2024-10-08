import Permission from '@permission';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Permissions from 'permissions/permissions';

const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);

// Used for role template name
const ORG_OWNER = new Permission();
ORG_OWNER.setAll(ORG_BITS);

const ORG_ADMIN = new Permission();
ORG_ADMIN.setAll([
	Permissions.ORG_ADMIN,
	Permissions.CREATE_TEAM,
	Permissions.EDIT_TEAM,
	Permissions.DELETE_TEAM
]);

const ORG_MEMBER = new Permission();
// Org member doesn't have any permission, if this is ever set, its just to remove the admin perms

// Used for role template name
const TEAM_OWNER = new Permission();
TEAM_OWNER.setAll(ORG_BITS);

const TEAM_ADMIN = new Permission();
TEAM_ADMIN.setAll(TEAM_BITS);

const TEAM_MEMBER = new Permission();
TEAM_MEMBER.setAll([
	Permissions.CREATE_APP,
	Permissions.EDIT_APP,
	Permissions.DELETE_APP,
	Permissions.CREATE_DEPLOYMENT,
	Permissions.EDIT_DEPLOYMENT,
	Permissions.DELETE_DEPLOYMENT,
	Permissions.CREATE_AGENT,
	Permissions.EDIT_AGENT,
	Permissions.DELETE_AGENT,
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
	Permissions.DELETE_ASSET,
	Permissions.CREATE_VARIABLE,
	Permissions.EDIT_VARIABLE,
	Permissions.DELETE_VARIABLE
]);

const NOT_LOGGED_IN = new Permission();
export const REGISTERED_USER = new Permission();

export const TeamRoles: any = Object.seal(
	Object.freeze(
		Object.preventExtensions({
			TEAM_MEMBER,
			TEAM_ADMIN
		})
	)
);

export const OrgRoles: any = Object.seal(
	Object.freeze(
		Object.preventExtensions({
			ORG_ADMIN,
			ORG_MEMBER
		})
	)
);

export const roleNameMap = {
	[ROOT.base64]: 'Root',

	[ORG_ADMIN.base64]: 'Org Admin',
	[TEAM_ADMIN.base64]: 'Team Admin',
	[TEAM_MEMBER.base64]: 'Team Member',

	//Note: technical resaons
	[REGISTERED_USER.base64]: 'Registered User',
	[NOT_LOGGED_IN.base64]: 'Not Logged In'
};

export type TeamRoleKey = keyof typeof TeamRoles;
export type OrgRoleKey = keyof typeof OrgRoles;

export const OrgRoleOptions = [
	{ label: 'Org Admin', value: 'ORG_ADMIN' },
	{ label: 'Org Member', value: 'ORG_MEMBER' }
];

export const TeamRoleOptions = [
	{ label: 'Team Member', value: 'TEAM_MEMBER' },
	{ label: 'Team Admin', value: 'TEAM_ADMIN' }
];
