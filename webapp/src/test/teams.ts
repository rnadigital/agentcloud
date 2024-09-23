import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import { getSessionData } from './account';
import { getTeamById } from '../db/team';
import { setStripePlan } from '../db/account';
import { SubscriptionPlan } from '../lib/struct/billing'
import { getInitialData, makeFetch, fetchTypes } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';
import toObjectId from '../lib/misc/toobjectid';

dotenv.config({ path: '.env' });

afterAll(async () => {
	await db.db().collection('accounts').deleteOne({ email: 'testuser@example.com' });
	await db.client().close();
});


describe('team tests', () => {
	test('cant add new team without stripe permissions', async ()=> {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();
		const body = {
			teamName: 'TestTeam1',
			resourceSlug
		}
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/add`;
		const response = await makeFetch(url, fetchTypes.POST, body);
		expect(response.status).toBe(400);
	});

	test('add new team with correct stripe permissions', async ()=> {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();

		const stripeCustomerId = initialData?.accountData?.account?.stripe?.stripeCustomerId;
		const plan = SubscriptionPlan.TEAMS
		setStripePlan(stripeCustomerId, plan);

		const url =`${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/add`;
		const body = {
			teamName: 'TestTeam1',
			resourceSlug
		}

		const response = await makeFetch(url, fetchTypes.POST, body);
		
		const responseJson = await response.json();
		expect(response.status).toBe(200);
		expect(responseJson?._id).toBeDefined();
		expect(responseJson?.orgId).toBeDefined();
		const teamInDb = getTeamById(toObjectId(responseJson?._id));
		expect(teamInDb).toBeDefined();
	});

	//adding member is only current team edit operation
	//create a new account to invite to the team
	test('editing a team with correct permissions', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();

	});

	test('getting all members includes correct list', async () =>{
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();
		//teamJson (getting all members from a team)
	})

	test('testing all member permissions', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();
		//testing every role permission option
	})

	test('transferring ownership', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();
	})

	test('removing team member from team', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();
	})

	test('removing old owner from team', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();
	})

	test('log out', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/logout`;
		const body = {
			_csrf: csrfToken
		};

		const response = await makeFetch(url, fetchTypes.POST, body);

		const responseJson = await response.json()
		expect(responseJson?.redirect).toBeDefined();
		expect(response.status).toBe(200);
	});

	test('cant get account with invalidated session cookie', async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();

		const url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
		const response = await makeFetch(url, fetchTypes.GET);
		expect(response.status).toBe(302); //302 redirect to login
	});

});