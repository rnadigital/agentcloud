import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import { makeFetch, fetchTypes, setInitialData, getInitialData, accountDetails } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config({ path: '.env' });
let sessionCookie;

beforeAll(async () => {
	await db.connect();
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account1_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account2_email });
});



describe('account tests', () => {

	test('register new account', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			}, 
			body: JSON.stringify({
				name: accountDetails.account1_name,
				email: accountDetails.account1_email,
				password: accountDetails.account1_name
			}),
			redirect: 'manual',
		});
		expect(response.status).toBe(200);
	});

	test('login as new user', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account1_email,
				password: accountDetails.account1_name
			}),
			redirect: 'manual',
		});
		sessionCookie = response.headers.get('set-cookie')
		setInitialData(accountDetails.account1_email, {sessionCookie})
		expect(sessionCookie).toMatch(/^connect\.sid/);
	});

	test('get account', async () => {
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
		const response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
		const accountJson = await response.json();
		setInitialData(accountDetails.account1_email, { accountData: accountJson, sessionCookie });
		expect(response.status).toBe(200);
	});

	test('request change password', async () => {
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/requestchangepassword`;
		const body = {
			email: accountDetails.account1_email
		}
		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		const responseJson = await response.json();
		expect(responseJson?.redirect).toBeDefined();
		expect(response.status).toBe(200);
	});

	test('cant change password without valid token', async () => {
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/changepassword`;
		const body = {
			token: "abcd",
			password: "attemptedPasswordChange"
		};
		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);

		const responseJson = await response.json();
		expect(responseJson?.error).toBeDefined();
		expect(response.status).toBe(400);
	});
	
	//test with valid token??

	test('set role', async () => {
		const {resourceSlug} = await getInitialData(accountDetails.account1_email)
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/role?resourceSlug=${resourceSlug}`;
		const body = {
			role: 'data_engineer',
			resourceSlug
		}
		const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		const responseJson = await response.json();
		expect(responseJson?.redirect).toBe(`/${resourceSlug}/onboarding/configuremodels`);
		expect(response.status).toBe(200);
	})

	test('get welcome data', async () => {
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/welcome.json`;
		const response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
		const responseJson = await response.json();
		expect(responseJson?.team).toBeDefined();
		expect(responseJson?.teamMembers).toBeDefined();
	})

});