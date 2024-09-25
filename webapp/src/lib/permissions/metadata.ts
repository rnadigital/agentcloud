import Permissions from 'permissions/permissions';

const Metadata = Object.seal(
	Object.freeze(
		Object.preventExtensions({
			[Permissions.ROOT]: {
				heading: 'Developer Permissions',
				title: 'Root',
				label: 'Root',
				desc: 'Root permissions',
				parent: Permissions.ROOT,
				blocked: true
			},
			[Permissions.ORG_OWNER]: {
				title: 'Org Owner',
				label: 'Organization Owner',
				desc: 'Permissions for organization owners',
				parent: Permissions.ROOT
			},
			[Permissions.TEAM_OWNER]: {
				title: 'Team Owner',
				label: 'Team Owner',
				desc: 'Permissions for team owners',
				parent: Permissions.ORG_OWNER
			},

			[Permissions.CREATE_ORG]: {
				heading: 'Account Permissions',
				title: 'Create Organization',
				label: 'Create Org',
				desc: 'Ability to create an organization'
			},
			[Permissions.EDIT_ORG]: {
				title: 'Edit Organization',
				label: 'Edit Org',
				desc: 'Ability to edit an organization'
			},
			[Permissions.DELETE_ORG]: {
				title: 'Delete Organization',
				label: 'Delete Org',
				desc: 'Ability to delete an organization'
			},

			[Permissions.ORG_ADMIN]: {
				heading: 'Org Permissions',
				title: 'Org Admin',
				label: 'Organization Admin',
				desc: 'Permissions for organization admins',
				parent: Permissions.ORG_OWNER
			},

			[Permissions.CREATE_TEAM]: {
				title: 'Create Team',
				label: 'Create Team',
				desc: 'Ability to create a team'
			},
			[Permissions.EDIT_TEAM]: {
				title: 'Edit Team',
				label: 'Edit Team',
				desc: 'Ability to edit a team'
			},
			[Permissions.DELETE_TEAM]: {
				title: 'Delete Team',
				label: 'Delete Team',
				desc: 'Ability to delete a team'
			},

			[Permissions.TEAM_ADMIN]: {
				heading: 'Team Permissions',
				title: 'Team Admin',
				label: 'Team Admin',
				desc: 'Permissions for team admins',
				parent: Permissions.TEAM_OWNER
			},

			[Permissions.ADD_TEAM_MEMBER]: {
				title: 'Add Team Member',
				label: 'Add Member',
				desc: 'Ability to add a team member'
			},
			[Permissions.EDIT_TEAM_MEMBER]: {
				title: 'Edit Team Member',
				label: 'Edit Member',
				desc: 'Ability to edit team members'
			},
			[Permissions.REMOVE_TEAM_MEMBER]: {
				title: 'Remove Team Member',
				label: 'Remove Member',
				desc: 'Ability to remove a team member'
			},

			[Permissions.CREATE_APP]: {
				title: 'Create App',
				label: 'Create App',
				desc: 'Ability to create an app'
			},
			[Permissions.EDIT_APP]: {
				title: 'Edit App',
				label: 'Edit App',
				desc: 'Ability to edit an app'
			},
			[Permissions.DELETE_APP]: {
				title: 'Delete App',
				label: 'Delete App',
				desc: 'Ability to delete an app',
				parent: Permissions.ORG_OWNER
			},

			[Permissions.CREATE_DEPLOYMENT]: {
				title: 'Create Deployment',
				label: 'Create Deployment',
				desc: 'Ability to create a deployment'
			},
			[Permissions.EDIT_DEPLOYMENT]: {
				title: 'Edit Deployment',
				label: 'Edit Deployment',
				desc: 'Ability to edit a deployment'
			},
			[Permissions.DELETE_DEPLOYMENT]: {
				title: 'Delete Deployment',
				label: 'Delete Deployment',
				desc: 'Ability to delete a deployment'
			},

			[Permissions.CREATE_AGENT]: {
				title: 'Create Agent',
				label: 'Create Agent',
				desc: 'Ability to create an agent'
			},
			[Permissions.EDIT_AGENT]: {
				title: 'Edit Agent',
				label: 'Edit Agent',
				desc: 'Ability to edit an agent'
			},
			[Permissions.DELETE_AGENT]: {
				title: 'Delete Agent',
				label: 'Delete Agent',
				desc: 'Ability to delete an agent'
			},

			[Permissions.CREATE_MODEL]: {
				title: 'Create Model',
				label: 'Create Model',
				desc: 'Ability to create a model'
			},
			[Permissions.EDIT_MODEL]: {
				title: 'Edit Model',
				label: 'Edit Model',
				desc: 'Ability to edit a model'
			},
			[Permissions.DELETE_MODEL]: {
				title: 'Delete Model',
				label: 'Delete Model',
				desc: 'Ability to delete a model'
			},

			[Permissions.CREATE_TASK]: {
				title: 'Create Task',
				label: 'Create Task',
				desc: 'Ability to create a task'
			},
			[Permissions.EDIT_TASK]: {
				title: 'Edit Task',
				label: 'Edit Task',
				desc: 'Ability to edit a task'
			},
			[Permissions.DELETE_TASK]: {
				title: 'Delete Task',
				label: 'Delete Task',
				desc: 'Ability to delete a task'
			},

			[Permissions.CREATE_TOOL]: {
				title: 'Create Tool',
				label: 'Create Tool',
				desc: 'Ability to create a tool'
			},
			[Permissions.EDIT_TOOL]: {
				title: 'Edit Tool',
				label: 'Edit Tool',
				desc: 'Ability to edit a tool'
			},
			[Permissions.DELETE_TOOL]: {
				title: 'Delete Tool',
				label: 'Delete Tool',
				desc: 'Ability to delete a tool'
			},
			[Permissions.DELETE_TOOL]: {
				title: 'Delete Tool',
				label: 'Delete Tool',
				desc: 'Ability to delete a tool'
			},

			[Permissions.CREATE_DATASOURCE]: {
				title: 'Create DataSource',
				label: 'Create DataSource',
				desc: 'Ability to create a data source'
			},
			[Permissions.EDIT_DATASOURCE]: {
				title: 'Edit DataSource',
				label: 'Edit DataSource',
				desc: 'Ability to edit a data source'
			},
			[Permissions.SYNC_DATASOURCE]: {
				title: 'Sync DataSource',
				label: 'Sync DataSource',
				desc: 'Ability to sync a data source'
			},
			[Permissions.DELETE_DATASOURCE]: {
				title: 'Delete DataSource',
				label: 'Delete DataSource',
				desc: 'Ability to delete a data source'
			},

			[Permissions.UPLOAD_ASSET]: {
				title: 'Upload Asset',
				label: 'Upload Asset',
				desc: 'Ability to upload an asset'
			},
			[Permissions.DELETE_ASSET]: {
				title: 'Delete Asset',
				label: 'Delete Asset',
				desc: 'Ability to delete an asset'
			},
			[Permissions.CREATE_VARIABLE]: {
				title: 'Create Variable',
				label: 'Create Variable',
				desc: 'Ability to create a variable'
			},
			[Permissions.EDIT_VARIABLE]: {
				title: 'Edit Variable',
				label: 'Edit Variable',
				desc: 'Ability to edit a variable'
			},
			[Permissions.DELETE_VARIABLE]: {
				title: 'Delete Variable',
				label: 'Delete Variable',
				desc: 'Ability to delete a variable'
			}
		})
	)
);

export default Metadata;
