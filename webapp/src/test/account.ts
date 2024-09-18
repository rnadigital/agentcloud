import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config({ path: '.env' });
let sessionCookie;
let csrfToken: string;
let resourceSlug: string;

beforeAll(async () => {
	await db.connect();
	await db.db().collection('accounts').deleteOne({ email: 'testuser@example.com' });
});

afterAll(async () => {
	await db.db().collection('account').deleteOne({email: 'testuser@example.com'});
	await db.client().close();
})

describe('account tests', () => {

	test('register new account', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				name: 'Test User',
				email: 'testuser@example.com',
				password: 'Test.Password.123'
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
				email: 'testuser@example.com',
				password: 'Test.Password.123'
			}),
			redirect: 'manual',
		});
		sessionCookie = response.headers.get('set-cookie');
		expect(sessionCookie).toMatch(/^connect\.sid/);
	});

	test('get account', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/account.json`, {
			headers: {
				cookie: sessionCookie
			},
			redirect: 'manual',
		});
		const accountJson = await response.json();
		csrfToken = accountJson.csrf;
		resourceSlug = accountJson.account.currentTeam;
		expect(response.status).toBe(200);
	});

	test('request change password', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/requestchangepassword`,{
			method: 'POST',
			headers: {
				cookie: sessionCookie,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				email: 'testuser@example.com',
			}),
			redirect: 'manual',
		});
		const responseJson = await response.json();
		expect(responseJson?.redirect).toBeDefined();
		expect(response.status).toBe(200);
	});

	test('cant change password without valid token', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/changepassword`, {
			method: 'POST',
			headers: {
				cookie: sessionCookie,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				token: "abcd",
				password: "attemptedPasswordChange"
			}),
			redirect: 'manual'
		});
		const responseJson = await response.json();
		expect(responseJson?.error).toBeDefined();
		expect(response.status).toBe(400);
	});

	//set onboarded in the database

	test('setting role', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/role?resourceSlug=${resourceSlug}`, {
			method: 'POST',
			headers: {
				cookie: sessionCookie,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				role: 'data_engineer',
				_csrf: csrfToken,
				resourceSlug
			}),
			redirect: 'manual'
		});
		const responseJson = await response.json();
		expect(responseJson?.redirect).toBe(`/${resourceSlug}/onboarding/configuremodels`);
		expect(response.status).toBe(200);
	})
	test('get welcome data', async () => {
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/welcome.json`, {
			method:'GET',
			headers: {
				cookie: sessionCookie
			},
			redirect: 'manual'
		});
		const responseJson = await response.json();
		expect(responseJson?.team).toBeDefined();
		expect(responseJson?.teamMembers).toBeDefined();
	})
	//test with valid token??

	test('log out', async () => {
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
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/account.json`, {
			headers: {
				cookie: sessionCookie
			},
			redirect: 'manual',
		});
		expect(response.status).toBe(302); //302 redirect to login
	});

});
