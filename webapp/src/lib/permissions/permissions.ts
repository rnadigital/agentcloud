const Permissions = Object.seal(Object.freeze(Object.preventExtensions({

	ROOT: 0,
	TESTING: 1,

	// Gets set in calcPerms based on context
	ORG_OWNER: 10,
	TEAM_OWNER: 15,

	// Account level perms
	CREATE_ORG: 25,
	EDIT_ORG: 30,
	DELETE_ORG: 35,

	// Org level perms
	CREATE_TEAM: 40,
	EDIT_TEAM: 45,
	DELETE_TEAM: 50,

	// Team level perms
	ADD_TEAM_MEMBER: 55,
	EDIT_TEAM_MEMBER: 60,
	REMOVE_TEAM_MEMBER: 65,

	CREATE_APP: 70,
	EDIT_APP: 75,
	DELETE_APP: 80,

	CREATE_DEPLOYMENT: 85,
	EDIT_DEPLOYMENT: 90,
	DELETE_DEPLOYMENT: 95,

	CREATE_AGENT: 100,
	EDIT_AGENT: 105,
	DELETE_AGENT: 110,

	CREATE_MODEL: 115,
	EDIT_MODEL: 120,
	DELETE_MODEL: 125,

	CREATE_CREDENTIAL: 130,
	EDIT_CREDENTIAL: 135,
	DELETE_CREDENTIAL: 140,

	CREATE_TASK: 145,
	EDIT_TASK: 150,
	DELETE_TASK: 155,

	CREATE_TOOL: 160,
	EDIT_TOOL: 165,
	DELETE_TOOL: 170,

	CREATE_DATASOURCE: 175,
	EDIT_DATASOURCE: 180,
	DELETE_DATASOURCE: 185,

	DUMMY_BIT: 255, // Just padding

})));
//TODO: split these up in to categories? since there wont be any set "team" bits from 55-185 for perms records on orgs/accounts/whatever

export default Permissions;
