import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import { makeFetch, fetchTypes, setInitialData, getInitialData, accountDetails } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config({ path: '.env' });
let sessionCookie1;
let sessionCookie2;
let sessionCookie3;
let sessionCookie4;
let sessionCookie5;
let sessionCookie6;
let sessionCookie7;
let sessionCookie8;
let sessionCookie9;
let sessionCookie10;
let sessionCookie11;
const SECONDS = 1000;
beforeAll(async () => {
	await db.connect();
	await db.db().collection('accounts').deleteMany({ 
		email: { 
			$in: [
				accountDetails.account1_email,
				accountDetails.account2_email,
				accountDetails.account3_email,
				accountDetails.account4_email,
				accountDetails.account5_email,
				accountDetails.account6_email,
				accountDetails.account7_email,
				accountDetails.account8_email,
				accountDetails.account9_email,
				accountDetails.account10_email,
				accountDetails.account11_email
			] 
		}
	});
	
});



describe('account tests', () => {

	test('register new accounts', async () => {
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

		await db.db().collection('accounts').deleteMany({ email: accountDetails.account1_email });
		await db.db().collection('accounts').deleteMany({ email: accountDetails.account2_email });
		await db.db().collection('accounts').deleteMany({ email: accountDetails.account3_email }); //delete these accounts so we can stress test logins in the next test
	}, 60 * SECONDS); //extended timeout due to multiple account creations

	test('stress test registration with many accounts', async () => {
		const accounts = [
			{ name: accountDetails.account1_name, email: accountDetails.account1_email, password: accountDetails.account1_password },
			{ name: accountDetails.account2_name, email: accountDetails.account2_email, password: accountDetails.account2_password },
			{ name: accountDetails.account3_name, email: accountDetails.account3_email, password: accountDetails.account3_password },
			{ name: accountDetails.account4_name, email: accountDetails.account4_email, password: accountDetails.account4_password },
			{ name: accountDetails.account5_name, email: accountDetails.account5_email, password: accountDetails.account5_password },
			{ name: accountDetails.account6_name, email: accountDetails.account6_email, password: accountDetails.account6_password },
			{ name: accountDetails.account7_name, email: accountDetails.account7_email, password: accountDetails.account7_password },
			{ name: accountDetails.account8_name, email: accountDetails.account8_email, password: accountDetails.account8_password },
			{ name: accountDetails.account9_name, email: accountDetails.account9_email, password: accountDetails.account9_password },
			{ name: accountDetails.account10_name, email: accountDetails.account10_email, password: accountDetails.account10_password },
			{ name: accountDetails.account11_name, email: accountDetails.account11_email, password: accountDetails.account11_password }
		];
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`;
		let body;
	
		for (const account of accounts) {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					name: account.name,
					email: account.email,
					password: account.password
				}),
				redirect: 'manual'
			});
			expect(response.status).toBe(200);
		}
	}, 60 * SECONDS * 2); // extended timeout due to multiple account creations
	
	

	//TODO: refactor this to do it with a loop
	test('login as new users - 11 logins', async () => {
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
		sessionCookie1 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account1_email, { sessionCookie: sessionCookie1 });
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
		sessionCookie2 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account2_email, { sessionCookie: sessionCookie2 });
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
		sessionCookie3 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account3_email, { sessionCookie: sessionCookie3 });
		expect(sessionCookie3).toMatch(/^connect\.sid/);
	
		// Continuing to log in the remaining accounts
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account4_email,
				password: accountDetails.account4_password
			}),
			redirect: 'manual',
		});
		sessionCookie4 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account4_email, { sessionCookie: sessionCookie4 });
		expect(sessionCookie4).toMatch(/^connect\.sid/);
	
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account5_email,
				password: accountDetails.account5_password
			}),
			redirect: 'manual',
		});
		sessionCookie5 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account5_email, { sessionCookie: sessionCookie5 });
		expect(sessionCookie5).toMatch(/^connect\.sid/);
	
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account6_email,
				password: accountDetails.account6_password
			}),
			redirect: 'manual',
		});
		sessionCookie6 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account6_email, { sessionCookie: sessionCookie6 });
		expect(sessionCookie6).toMatch(/^connect\.sid/);
	
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account7_email,
				password: accountDetails.account7_password
			}),
			redirect: 'manual',
		});
		sessionCookie7 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account7_email, { sessionCookie: sessionCookie7 });
		expect(sessionCookie7).toMatch(/^connect\.sid/);
	
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account8_email,
				password: accountDetails.account8_password
			}),
			redirect: 'manual',
		});
		sessionCookie8 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account8_email, { sessionCookie: sessionCookie8 });
		expect(sessionCookie8).toMatch(/^connect\.sid/);
	
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account9_email,
				password: accountDetails.account9_password
			}),
			redirect: 'manual',
		});
		sessionCookie9 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account9_email, { sessionCookie: sessionCookie9 });
		expect(sessionCookie9).toMatch(/^connect\.sid/);
	
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account10_email,
				password: accountDetails.account10_password
			}),
			redirect: 'manual',
		});
		sessionCookie10 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account10_email, { sessionCookie: sessionCookie10 });
		expect(sessionCookie10).toMatch(/^connect\.sid/);
	
		response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: accountDetails.account11_email,
				password: accountDetails.account11_password
			}),
			redirect: 'manual',
		});
		sessionCookie11 = response.headers.get('set-cookie');
		setInitialData(accountDetails.account11_email, { sessionCookie: sessionCookie11 });
		expect(sessionCookie11).toMatch(/^connect\.sid/);
	}, 60 * SECONDS); // extended timeout due to multiple account logins
	

	test('get account', async () => {
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
		const accounts = [
			{ email: accountDetails.account1_email, sessionCookie: sessionCookie1 },
			{ email: accountDetails.account2_email, sessionCookie: sessionCookie2 },
			{ email: accountDetails.account3_email, sessionCookie: sessionCookie3 },
			{ email: accountDetails.account4_email, sessionCookie: sessionCookie4 },
			{ email: accountDetails.account5_email, sessionCookie: sessionCookie5 },
			{ email: accountDetails.account6_email, sessionCookie: sessionCookie6 },
			{ email: accountDetails.account7_email, sessionCookie: sessionCookie7 },
			{ email: accountDetails.account8_email, sessionCookie: sessionCookie8 },
			{ email: accountDetails.account9_email, sessionCookie: sessionCookie9 },
			{ email: accountDetails.account10_email, sessionCookie: sessionCookie10 },
			{ email: accountDetails.account11_email, sessionCookie: sessionCookie11 }
		];
	
		for (const account of accounts) {
			const response = await makeFetch(url, fetchTypes.GET, account.email);
			const accountJson = await response.json();
			setInitialData(account.email, { accountData: accountJson, sessionCookie: account.sessionCookie });
			expect(response.status).toBe(200);
		}
	}, 60 * SECONDS); // extended timeout for multiple account data retrievals
	
	

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
	test('set role - onboarding', async () => {
		const accounts = [
			accountDetails.account1_email,
			accountDetails.account2_email,
			accountDetails.account3_email,
			accountDetails.account4_email,
			accountDetails.account5_email,
			accountDetails.account6_email,
			accountDetails.account7_email,
			accountDetails.account8_email,
			accountDetails.account9_email,
			accountDetails.account10_email,
			accountDetails.account11_email
		];
	
		for (const email of accounts) {
			const accountObject = await getInitialData(email);
			const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/role?resourceSlug=${accountObject.resourceSlug}`;
			const body = {
				role: 'data_engineer',
				resourceSlug: accountObject.resourceSlug
			};
			const response = await makeFetch(url, fetchTypes.POST, email, body);
			const responseJson = await response.json();
			expect(responseJson?.redirect).toBe(`/${accountObject.resourceSlug}/onboarding/configuremodels`);
			expect(response.status).toBe(200);
		}
	});
	

	test('get welcome data', async () => {
		const url = `${process.env.WEBAPP_TEST_BASE_URL}/welcome.json`;
		const response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
		const responseJson = await response.json();
		expect(responseJson?.team).toBeDefined();
		expect(responseJson?.teamMembers).toBeDefined();
	})

});