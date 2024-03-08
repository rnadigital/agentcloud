import Permissions from 'permissions/permissions';

const Metadata = Object.seal(Object.freeze(Object.preventExtensions({

	[Permissions.ROOT]: { title: 'Root', label: 'Root', desc: 'Root permissions', parent: Permissions.ROOT },
	[Permissions.TESTING]: { title: 'TESTING', label: 'TESTING', desc: 'TESTING', parent: Permissions.ROOT },
	[Permissions.ORG_OWNER]: { title: 'Org Owner', label: 'Organization Owner', desc: 'Permissions for organization owners' },
	[Permissions.TEAM_OWNER]: { title: 'Team Owner', label: 'Team Owner', desc: 'Permissions for team owners', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_ORG]: { title: 'Create Organization', label: 'Create Org', desc: 'Ability to create an organization', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_ORG]: { title: 'Edit Organization', label: 'Edit Org', desc: 'Ability to edit an organization', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_ORG]: { title: 'Delete Organization', label: 'Delete Org', desc: 'Ability to delete an organization', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_TEAM]: { title: 'Create Team', label: 'Create Team', desc: 'Ability to create a team', parent: Permissions.TEAM_OWNER },
	[Permissions.EDIT_TEAM]: { title: 'Edit Team', label: 'Edit Team', desc: 'Ability to edit a team', parent: Permissions.TEAM_OWNER },
	[Permissions.DELETE_TEAM]: { title: 'Delete Team', label: 'Delete Team', desc: 'Ability to delete a team', parent: Permissions.TEAM_OWNER },
	[Permissions.ADD_TEAM_MEMBER]: { title: 'Add Team Member', label: 'Add Member', desc: 'Ability to add a team member', parent: Permissions.TEAM_OWNER },
	[Permissions.EDIT_TEAM_MEMBER]: { title: 'Edit Team Member', label: 'Edit Member', desc: 'Ability to edit team members', parent: Permissions.TEAM_OWNER },
	[Permissions.REMOVE_TEAM_MEMBER]: { title: 'Remove Team Member', label: 'Remove Member', desc: 'Ability to remove a team member', parent: Permissions.TEAM_OWNER },

	[Permissions.CREATE_APP]: { title: 'Create App', label: 'Create App', desc: 'Ability to create an app', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_APP]: { title: 'Edit App', label: 'Edit App', desc: 'Ability to edit an app', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_APP]: { title: 'Delete App', label: 'Delete App', desc: 'Ability to delete an app', parent: Permissions.ORG_OWNER},

	[Permissions.CREATE_DEPLOYMENT]: { title: 'Create Deployment', label: 'Create Deployment', desc: 'Ability to create a deployment', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_DEPLOYMENT]: { title: 'Edit Deployment', label: 'Edit Deployment', desc: 'Ability to edit a deployment', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_DEPLOYMENT]: { title: 'Delete Deployment', label: 'Delete Deployment', desc: 'Ability to delete a deployment', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_AGENT]: { title: 'Create Agent', label: 'Create Agent', desc: 'Ability to create an agent', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_AGENT]: { title: 'Edit Agent', label: 'Edit Agent', desc: 'Ability to edit an agent', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_AGENT]: { title: 'Delete Agent', label: 'Delete Agent', desc: 'Ability to delete an agent', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_MODEL]: { title: 'Create Model', label: 'Create Model', desc: 'Ability to create a model', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_MODEL]: { title: 'Edit Model', label: 'Edit Model', desc: 'Ability to edit a model', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_MODEL]: { title: 'Delete Model', label: 'Delete Model', desc: 'Ability to delete a model', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_CREDENTIAL]: { title: 'Create Credential', label: 'Create Credential', desc: 'Ability to create a credential', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_CREDENTIAL]: { title: 'Edit Credential', label: 'Edit Credential', desc: 'Ability to edit a credential', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_CREDENTIAL]: { title: 'Delete Credential', label: 'Delete Credential', desc: 'Ability to delete a credential', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_TASK]: { title: 'Create Task', label: 'Create Task', desc: 'Ability to create a task', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_TASK]: { title: 'Edit Task', label: 'Edit Task', desc: 'Ability to edit a task', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_TASK]: { title: 'Delete Task', label: 'Delete Task', desc: 'Ability to delete a task', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_TOOL]: { title: 'Create Tool', label: 'Create Tool', desc: 'Ability to create a tool', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_TOOL]: { title: 'Edit Tool', label: 'Edit Tool', desc: 'Ability to edit a tool', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_TOOL]: { title: 'Delete Tool', label: 'Delete Tool', desc: 'Ability to delete a tool', parent: Permissions.ORG_OWNER },

	[Permissions.CREATE_DATASOURCE]: { title: 'Create DataSource', label: 'Create DataSource', desc: 'Ability to create a data source', parent: Permissions.ORG_OWNER },
	[Permissions.EDIT_DATASOURCE]: { title: 'Edit DataSource', label: 'Edit DataSource', desc: 'Ability to edit a data source', parent: Permissions.ORG_OWNER },
	[Permissions.DELETE_DATASOURCE]: { title: 'Delete DataSource', label: 'Delete DataSource', desc: 'Ability to delete a data source', parent: Permissions.ORG_OWNER },

})));

export default Metadata;
