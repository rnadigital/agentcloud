import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import { getSessionData } from './account';
import { getTeamById } from '../db/team';
import { setStripePlan } from '../db/account';
import { SubscriptionPlan } from '../lib/struct/billing'
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
		const initialData = getSessionData();
		const sessionCookie = initialData?.sessionCookie;
		const resourceSlug = initialData?.accountData?.account?.currentTeam;
		const csrfToken = initialData?.accountData?.csrf;

		console.log("variables: ", sessionCookie, resourceSlug, csrfToken);


		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/add`,{
			method: 'POST',
			headers: {
				cookie: sessionCookie,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				teamName: 'TestTeam1',
				_csrf: csrfToken,
				resourceSlug
			}),
			redirect:'manual'
		});
		expect(response.status).toBe(400);
	});

	test('add new team with correct stripe permissions', async ()=> {
		const initialData = getSessionData();
		const sessionCookie = initialData?.sessionCookie;
		const resourceSlug = initialData?.accountData?.account?.currentTeam;
		const csrfToken = initialData?.accountData?.csrf;

		const stripeCustomerId = initialData?.accountData?.account?.stripe?.stripeCustomerId;
		const plan = SubscriptionPlan.TEAMS
		setStripePlan(stripeCustomerId, plan);

		console.log("variables: ", sessionCookie, resourceSlug, csrfToken);


		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/team/add`,{
			method: 'POST',
			headers: {
				cookie: sessionCookie,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				teamName: 'TestTeam1',
				_csrf: csrfToken,
				resourceSlug
			}),
			redirect:'manual'
		});
		const responseJson = await response.json();
		console.log("responseJson", await responseJson);
		expect(response.status).toBe(200);
		// expect(responseJson?._id).toBeDefined();
		// expect(responseJson?.orgId).toBeDefined();
		// const teamInDb = getTeamById(toObjectId(responseJson?._id));
		// expect(teamInDb).toBeDefined();
	});

	test('log out', async () => {
		const initialData = getSessionData();
		const sessionCookie = initialData?.sessionCookie;
		const resourceSlug = initialData?.accountData?.account?.currentTeam;
		const csrfToken = initialData?.accountData?.csrf;
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/logout`, {
			method: 'POST',
			headers: {
				cookie: sessionCookie,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				_csrf: csrfToken,
			}),
			redirect: 'manual',
		});
		const responseJson = await response.json()
		expect(responseJson?.redirect).toBeDefined();
		expect(response.status).toBe(200);
	});

	test('cant get account with invalidated session cookie', async () => {
		const accountData = getSessionData();
		const sessionCookie = accountData?.sessionCookie;
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/account.json`, {
			headers: {
				cookie: sessionCookie
			},
			redirect: 'manual',
		});
		expect(response.status).toBe(302); //302 redirect to login
	});

});

//adding a team

//adding team without stripe subscription

//editing a team

//inviting to team (create new account for this)

//teamJson (getting all members from a team)

//transferring ownership

//removing from a team