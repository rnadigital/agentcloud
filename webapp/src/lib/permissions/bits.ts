import Permissions from 'permissions/permissions';

export const ACCOUNT_BITS = Object.seal(
	Object.freeze(
		Object.preventExtensions([
			Permissions.ROOT,
			Permissions.CREATE_ORG,
			Permissions.EDIT_ORG,
			Permissions.DELETE_ORG
		])
	)
);

export const ORG_BITS = Object.seal(
	Object.freeze(
		Object.preventExtensions([
			Permissions.ORG_ADMIN,

			Permissions.CREATE_TEAM,
			Permissions.EDIT_TEAM,
			Permissions.DELETE_TEAM,

			Permissions.ADD_ORG_MEMBER,
			Permissions.EDIT_ORG_MEMBER,
			Permissions.REMOVE_ORG_MEMBER
		])
	)
);

export const TEAM_BITS = Object.seal(
	Object.freeze(
		Object.preventExtensions([
			Permissions.TEAM_ADMIN,

			Permissions.ADD_TEAM_MEMBER,
			Permissions.EDIT_TEAM_MEMBER,
			Permissions.REMOVE_TEAM_MEMBER,

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
			Permissions.DELETE_ASSET,

			Permissions.CREATE_VARIABLE,
			Permissions.EDIT_VARIABLE,
			Permissions.DELETE_VARIABLE
		])
	)
);
