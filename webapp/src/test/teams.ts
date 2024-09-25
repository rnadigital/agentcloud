import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import * as db from '../db/index';
import { addTeam, getTeamById, getTeamWithMembers } from '../db/team';
import { getAccountByEmail, setStripeCustomerId, setStripePlan } from '../db/account';
import { SubscriptionPlan } from '../lib/struct/billing';
import { getInitialData, makeFetch, fetchTypes, accountDetails, setInitialData, updateAllAccountCsrf } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';
import toObjectId from '../lib/misc/toobjectid';
import { ModelList, ModelType } from '../lib/struct/model';
import { ShareLinkTypes } from '../lib/struct/sharelink';
import { getToolsByTeam } from "../db/tool";
import { TeamRoles } from "../lib/permissions/roles"

dotenv.config({ path: '.env' });

afterAll(async () => {
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account1_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account2_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account3_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account4_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account5_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account6_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account7_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account8_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account9_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account10_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account11_email });
	await db.client().close();
});

beforeAll(async ()=>{
})

describe('team tests', () => {
	test('cant add new team without stripe permissions', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);
		const body = {
			teamName: 'TestTeam1',
			resourceSlug
		};
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/add`;
		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(400);
	});

	//when debugging or creating tests, mark this test as ".only" to ensure a second team is created, this team is used in future.
	test('add new team with correct stripe permissions', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);

		const stripeCustomerId = 'sk_12345'; //testing flags set stripe customer ID to null, need to set it to set the plan
		const plan = SubscriptionPlan.TEAMS;
		setStripeCustomerId(initialData?.accountData?.account?._id, stripeCustomerId);
		setStripePlan(stripeCustomerId, plan);

		const newAccount = await getAccountByEmail(accountDetails.account1_email);

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/add`;
		const body = {
			teamName: 'TestTeam1',
			resourceSlug
		};

		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);

		const responseJson = await response.json();
		expect(response.status).toBe(200);
		expect(responseJson?._id).toBeDefined();
		expect(responseJson?.orgId).toBeDefined();
		const teamInDb = getTeamById(toObjectId(responseJson?._id));
		expect(teamInDb).toBeDefined();
	});


	test('Inviting existing account to team', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/invite`;
		let body = {
			name: accountDetails.account2_name,
			email: accountDetails.account2_email,
			template: 'TEAM_MEMBER'
		};

		let response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);

		body = {
			name: accountDetails.account3_name,
			email: accountDetails.account3_email,
			template: 'TEAM_MEMBER'
		};
		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		console.log("team after inviting account 2 to the team", await(db.db().collection('teams').findOne({_id: toObjectId(resourceSlug)})))
		expect(response.status).toBe(200);
	});

	//sets the permissions to TEAM_MEMBER
	test('Inviting account already in team', async () => {
		const { resourceSlug } = await getInitialData(accountDetails.account1_email);
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/invite`;
		const body = {
			name: accountDetails.account2_name,
			email: accountDetails.account2_email,
			template: 'TEAM_MEMBER'
		};

		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);

		const responseJson = await response.json();
		expect(response.status).toBe(409);
		expect(responseJson?.error).toBe('User is already on your team');
	});

	test('Getting team.json', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/team.json`;
		const response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);

		const responseJson = await response.json();

		//the 'team' object returned by this call is an array of teams, uses teh same teamData for all .json calls
		expect(responseJson?.team?.members.length).toBe(3);
	});

	test('testing TEAM_MEMBER permissions', async () => {
		const account1Object = await getInitialData(
			//account1 is the ORG_ADMIN
			accountDetails.account1_email
		);
		let url;
		let body;

		const account2Object = await getInitialData(accountDetails.account2_email);

		//attempt to do something with account2 that they can't do
		//attempt to add a team with account2

		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/add`;
		body = {
			teamName: 'TestTeam1',
			resourceSlug: account1Object.resourceSlug
		};

		const makeTeamResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account2_email,
			body
		);

		//shouldn't be able to create a team with default TEAM_MEMBER permissions
		expect(makeTeamResponse.status).toBe(403);
		//get all tools to create agent with
		const allTools = await getToolsByTeam(toObjectId(account1Object.resourceSlug));
		expect(allTools).toBeDefined();
		
		const allToolIds = allTools.map((value) => value._id)

		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/model/add`;
		body = {
			name: 'testModel1',
			model: 'gpt-4o',
			config: {
				model: 'gpt-4o',
				api_key: 'abcdefg'
			},
			type: ModelType.OPENAI
		};

		const addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account1_email,
			body
		);



		const addModelResponseJson = await addModelResponse.json();
		expect(addModelResponse.status).toBe(200);
		expect(addModelResponseJson?._id).toBeDefined();
		expect(addModelResponseJson?.redirect).toBeDefined();

		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/agent/add`
		body = {
			toolIds: allToolIds,
			name: "Test Agent 1",
			role: "Test Agent 1",
			goal: "Test Agent 1",
			backstory: "Test Agent 1",
			modelId: addModelResponseJson?._id,
			functionModelId: addModelResponseJson?._id
		}

		let response = await makeFetch(url, fetchTypes.POST, accountDetails.account2_email, body);
		expect(response.status).toBe(200);
		const addAgentResponse = await response.json();
		expect(addAgentResponse?.redirect).toBeDefined();
		expect(addAgentResponse?._id).toBeDefined();
	});

	test('testing TEAM_ADMIN permissions', async () => {
		const account1Object = await getInitialData(accountDetails.account1_email);
		const account2Object = await getInitialData(accountDetails.account2_email);
		const account3Object = await getInitialData(accountDetails.account3_email);
		let url, body, response;

		//make account2 a TEAM_ADMIN
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/${account2Object?.initialData?.accountData?.account?._id}/edit`;
		body = {
			template: "TEAM_ADMIN"
		};

		const addAdminResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account1_email,
			body
		);
		expect(addAdminResponse.status).toBe(200); //ability for ORG_ADMIN to change a TEAM_MEMBER to TEAM_ADMIN

		//can't create new team as TEAM_ADMIN
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/add`;
		body = {
			teamName: 'testTEAMADMIN'
		};

		const addTeamResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account2_email,
			body
		);

		const addTeamResponseJson = await addTeamResponse.json();
		expect(addTeamResponse.status).toBe(403);

		//can create new shareLink as TEAM_ADMIN or TEAM_MEMBER, possible stripe error here
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/sharelink/add`;
		body = {
			type: ShareLinkTypes.APP
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account2_email, body);

		expect(response.status).toBe(200);
});

	//isn't implemented currently, not tested
	test('transferring ownership', async () => {
		expect(1).toBe(1);
		// const response = await makeFetch("", fetchTypes.GET);

		// const responseJson = await response.json();
	});

	test('removing TEAM_ADMIN from team, reinviting them again as a TEAM_MEMBER and testing permissions', async () => {
		const account1Object = await getInitialData(accountDetails.account1_email);
		const account2Object = await getInitialData(accountDetails.account2_email);
		const account3Object = await getInitialData(accountDetails.account3_email);

		let url, body, response;

		console.log("team BEFORE delete operation: ", await(db.db().collection('teams').findOne({_id: toObjectId(account1Object.resourceSlug)})));

		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/invite`;//delete operation, check line down
		body = {
			memberId: account2Object?.initialData?.accountData?.account?._id
		}

		response = await makeFetch(url, fetchTypes.DELETE, accountDetails.account1_email, body);

		console.log("account2 ID: ", account2Object?.initialData?.accountData?.account?._id);
		console.log(await(db.db().collection('teams').findOne({_id: toObjectId(account1Object.resourceSlug)})))
		console.log(await(response.text()));
		expect(response.status).toBe(200);

		//attempt to create a model with the removed member
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/team.json`;
		body = {
			name: 'testModel2',
			model: 'gpt-4o',
			config: {
				model: 'gpt-4o',
				api_key: 'abcdefg'
			},
			type: ModelType.OPENAI
		};

		response = await makeFetch(
			url,
			fetchTypes.GET,
			accountDetails.account2_email
		);

		expect(response.status).toBe(302); //get redirected in checkresourceslug to welcome with noaccess flagged instead of being able to get the route

		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/invite`;
		body = {
			name: accountDetails.account2_name,
			email: accountDetails.account2_email,
			template: "TEAM_MEMBER"
		}

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);

		expect(response.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/invite`;
		body = {
			name: accountDetails.account3_name,
			email: accountDetails.account3_email,
			template: "TEAM_MEMBER"
		}

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account2_email, body);

		expect(response.status).toBe(403); //should have invalid permissions
		
		let responseJson = await response.json();

		expect(responseJson?.error).toBe("Missing permission \"Add Team Member\"");//make sure it's a permissions error and not a stripe error etc...
	});

	test('cant add more than 10 members to TEAMS subscriptions plan', async () => {
		const { resourceSlug } = await getInitialData(accountDetails.account1_email);
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/invite`;
		let body, response;
		let teamMembers = await getTeamWithMembers(resourceSlug);

		body = {
			name: accountDetails.account4_name,
			email: accountDetails.account4_email,
			template: 'TEAM_MEMBER'
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);
		body = {
			name: accountDetails.account5_name,
			email: accountDetails.account5_email,
			template: 'TEAM_MEMBER'
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);
		body = {
			name: accountDetails.account6_name,
			email: accountDetails.account6_email,
			template: 'TEAM_MEMBER'
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);
		body = {
			name: accountDetails.account7_name,
			email: accountDetails.account7_email,
			template: 'TEAM_MEMBER'
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);
		body = {
			name: accountDetails.account8_name,
			email: accountDetails.account8_email,
			template: 'TEAM_MEMBER'
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);
		body = {
			name: accountDetails.account9_name,
			email: accountDetails.account9_email,
			template: 'TEAM_MEMBER'
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);
		body = {
			name: accountDetails.account10_name,
			email: accountDetails.account10_email,
			template: 'TEAM_MEMBER'
		};

		//this should be the 11th member in the team, this should be rejected
		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(response.status).toBe(200);
		body = {
			name: accountDetails.account11_name,
			email: accountDetails.account11_email,
			template: 'TEAM_MEMBER'
		};

		response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		teamMembers = await getTeamWithMembers(resourceSlug);
		expect(response.status).toBe(400);
	});

	test('log out', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/logout`;
		const body = {
			_csrf: csrfToken
		};

		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);

		const responseJson = await response.json();
		expect(responseJson?.redirect).toBeDefined();
		expect(response.status).toBe(200);
	});

	test('cant get account with invalidated session cookie', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
		const response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
		expect(response.status).toBe(302); //302 redirect to login
	});
});
