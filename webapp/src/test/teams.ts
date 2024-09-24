import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import * as db from '../db/index';
import { addTeam, getTeamById } from '../db/team';
import { getAccountByEmail, setStripeCustomerId, setStripePlan } from '../db/account';
import { SubscriptionPlan } from '../lib/struct/billing';
import { getInitialData, makeFetch, fetchTypes, accountDetails, setInitialData } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';
import toObjectId from '../lib/misc/toobjectid';
import { ModelList, ModelType } from '../lib/struct/model'

dotenv.config({ path: '.env' });

afterAll(async () => {
	// await db.db().collection('accounts').deleteMany({ email: accountDetails.account1_email });
	// await db.db().collection('accounts').deleteMany({ email: accountDetails.account2_email });
	await db.client().close();
});

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

	//adding member is only current team edit operation
	//create a new account to invite to the team
	test('Inviting existing account to team', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);
		const newAccount = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				name: accountDetails.account2_name,
				email: accountDetails.account2_email,
				password: accountDetails.account2_password
			}),
			redirect: 'manual'
		});

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/invite`;
		const body = {
			name: accountDetails.account2_name,
			email: accountDetails.account2_email,
			template: 'TEAM_MEMBER'
		};

		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
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
		expect(response.status).toBe(403);
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
		expect(responseJson?.team[0]?.members.length).toBe(2);
	});

	test('testing TEAM_MEMBER permissions', async () => {
		const account1Object = await getInitialData( //account1 is the ORG_ADMIN
			accountDetails.account1_email
		);
		let url;
		let body;
		
		//login to the new account that was created earlier, get it's InitialData then store that in setInitialData
		const loginResponse = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account2_email,
				password: accountDetails.account2_password
			}),
			redirect: 'manual'
		})

		const acc2Cookie = loginResponse.headers.get('set-cookie')
		setInitialData(accountDetails.account2_email, { sessionCookie: acc2Cookie });

		const jsonResponse = await makeFetch(`${process.env.WEBAPP_TEST_BASE_URL}/account.json`, fetchTypes.GET, accountDetails.account2_email);
		const accountJson = await jsonResponse.json();
		setInitialData(accountDetails.account2_email, { accountData: accountJson, sessionCookie: acc2Cookie });

		const account2Object = await getInitialData( accountDetails.account2_email );

		//attempt to do something with account2 that they can't do
		//attempt to add a team with account2

		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account2Object.resourceSlug}/forms/team/add`;
		body = {
			teamName: 'TestTeam1',
			resourceSlug: account2Object.resourceSlug
		};

		const makeTeamResponse = await makeFetch(url, fetchTypes.POST, accountDetails.account2_email, body);

		//shouldn't be able to create a team with default TEAM_MEMBER permissions
		expect(makeTeamResponse.status).toBe(400);

		//should be able to create model with default TEAM_MEMBER permissions
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account2Object.resourceSlug}/forms/model/add`;
		body = {
			name: "testModel1",
			model: 'gpt-4o',
			config: {
				model: 'gpt-4o',
				api_key: "abcdefg"
			},
			type: ModelType.OPENAI
		};

		const addModelResponse = await makeFetch(url, fetchTypes.POST, accountDetails.account2_email, body);

		const addModelResponseJson = await addModelResponse.json();
		expect(addModelResponse.status).toBe(200);
		expect(addModelResponseJson?._id).toBeDefined();
		expect(addModelResponseJson?.redirect).toBeDefined();
	});


	//exposed bug: when using the resourceSlug of account1, the stripe permissions aren't taken from account 1's stripe information, instead are taken from account 2
	test('testing TEAM_ADMIN permissions', async () => {
		const account1Object = await getInitialData(
			accountDetails.account1_email
		);
		const account2Object = await getInitialData(
			accountDetails.account2_email
		);
		let url;
		let body;


		//make account2 a TEAM_ADMIN
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/${account2Object?.initialData?.accountData?.account?._id}/edit`;
		body = {
			template : "TEAM_ADMIN"
		};

		const addAdminResponse = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		expect(addAdminResponse.status).toBe(200); //ability for ORG_ADMIN to change a TEAM_MEMBER to TEAM_ADMIN

		//can create new team as TEAM_ADMIN
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/team/add`;
		body = {
			teamName: "testTEAMADMIN"
		};

		const addTeamResponse = await makeFetch(url, fetchTypes.POST, accountDetails.account2_email, body);
		
		const addTeamResponseJson = await addTeamResponse.json();
		expect(addTeamResponse.status).toBe(200);
		
		expect(addTeamResponseJson?._id).toBeDefined();
		expect(addTeamResponseJson?.orgId).toBeDefined();
	});

	//test same stripe permissions issue with creating a shareLink

	//test same stripe permissions issue with deleting team

	//isn't implemented currently, not tested
	test('transferring ownership', async () => {
		expect(1).toBe(1);
		// const response = await makeFetch("", fetchTypes.GET);

		// const responseJson = await response.json();
	});

	test('removing TEAM_ADMIN from team, reinviting them again as a TEAM_MEMBER and testing permissions', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);

		// const response = await makeFetch("", fetchTypes.GET);

		// const responseJson = await response.json();
	});

	//shouldn't be possible
	test('cant remove', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account1_email
		);

		// const response = await makeFetch("", fetchTypes.GET);

		// const responseJson = await response.json();


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
