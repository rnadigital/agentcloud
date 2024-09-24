import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import { makeFetch, fetchTypes, setInitialData, getInitialData, accountDetails } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config({ path: '.env' });
let sessionCookie1;
let sessionCookie2;
let sessionCookie3;
const SECONDS = 1000;
beforeAll(async () => {
	await db.connect();
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account1_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account2_email });
	await db.db().collection('accounts').deleteMany({ email: accountDetails.account3_email });
});



describe('account tests', () => {

	test.only('register new accounts', async () => {
		let response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			}, 
			body: JSON.stringify({
				name: accountDetails.account1_name,
				email: accountDetails.account1_email,
				password: accountDetails.account1_password
			}),
			redirect: 'manual',
		});
		expect(response.status).toBe(200);

		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`, {
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

		expect(response.status).toBe(200);

		//account3 has the same password as account2, this tests if two users can have the same password
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				name: accountDetails.account3_name,
				email: accountDetails.account3_email,
				password: accountDetails.account3_password
			}),
			redirect: 'manual'
		});

		expect(response.status).toBe(200);
	}, 60 * SECONDS); //extended timeout due to multiple account creations

	test.only('login as new user', async () => {
		let response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account1_email,
				password: accountDetails.account1_password
			}),
			redirect: 'manual',
		});
		sessionCookie1 = response.headers.get('set-cookie')
		setInitialData(accountDetails.account1_email, {sessionCookie: sessionCookie1})
		expect(sessionCookie1).toMatch(/^connect\.sid/);

		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account2_email,
				password: accountDetails.account2_password
			}),
			redirect: 'manual',
		});
		sessionCookie2 = response.headers.get('set-cookie')

		setInitialData(accountDetails.account2_email, {sessionCookie: sessionCookie2})
		expect(sessionCookie2).toMatch(/^connect\.sid/);

		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account3_email,
				password: accountDetails.account3_password
			}),
			redirect: 'manual',
		});
		sessionCookie3 = response.headers.get('set-cookie')
		setInitialData(accountDetails.account3_email, {sessionCookie: sessionCookie3})
		expect(sessionCookie3).toMatch(/^connect\.sid/);
	}, 60 * SECONDS);//extended timeout due to multiple account gets


	test.only('get account', async () => {
		let url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
		let response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
		let accountJson = await response.json();
		setInitialData(accountDetails.account1_email, { accountData: accountJson, sessionCookie: sessionCookie1 });
		expect(response.status).toBe(200);

		response = await makeFetch(url, fetchTypes.GET, accountDetails.account2_email);
		accountJson = await response.json();
		setInitialData(accountDetails.account2_email, { accountData: accountJson, sessionCookie: sessionCookie2 });
		expect(response.status).toBe(200);
		
		response = await makeFetch(url, fetchTypes.GET, accountDetails.account3_email);
		accountJson = await response.json();
		setInitialData(accountDetails.account3_email, { accountData: accountJson, sessionCookie: sessionCookie3 });
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

	//sets the role to prevent redirects to onboarding in further tests
	test.only('set role', async () => {
		let accountObject = await getInitialData(accountDetails.account1_email)
		let url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/role?resourceSlug=${accountObject.resourceSlug}`;
		let body = {
			role: 'data_engineer',
			resourceSlug: accountObject.resourceSlug
		};
		let response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
		let responseJson = await response.json();
		expect(responseJson?.redirect).toBe(`/${accountObject.resourceSlug}/onboarding/configuremodels`);
		expect(response.status).toBe(200);
		
		//set the role for account 2
		accountObject = await getInitialData(accountDetails.account2_email);
		url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/role?resourceSlug=${accountObject.resourceSlug}`;
		body = {
			role: 'data_engineer',
			resourceSlug: accountObject.resourceSlug
		};
		response = await makeFetch(url, fetchTypes.POST, accountDetails.account2_email, body);
		responseJson = await response.json();
		expect(responseJson?.redirect).toBe(`/${accountObject.resourceSlug}/onboarding/configuremodels`);
		expect(response.status).toBe(200);

		//set the role for account 3
		accountObject = await getInitialData(accountDetails.account3_email);
		url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/role?resourceSlug=${accountObject.resourceSlug}`;
		body = {
			role: 'data_engineer',
			resourceSlug: accountObject.resourceSlug
		};
		response = await makeFetch(url, fetchTypes.POST, accountDetails.account3_email, body);
		responseJson = await response.json();
		expect(responseJson?.redirect).toBe(`/${accountObject.resourceSlug}/onboarding/configuremodels`);
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