import {describe, expect, test} from '@jest/globals';
import { deleteAccountByEmail } from 'db/account';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config({ path: '.env' });
let sessionCookie: string;
let csrfToken: string;

describe('Register and login', () => {

	deleteAccountByEmail('testuser@example.com');

	test('register new account', async () => {
		const params = new URLSearchParams();
		params.append('name', 'Test User');
		params.append('email', 'testuser@example.com');
		params.append('password', 'Test.Password.123');
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/register`, {
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		console.log((await response.text()));
		expect(response.status).toBe(302);
		expect(response.headers.get('set-cookie')).toBeDefined();
	});

	test('login as new user', async () => {
		const params = new URLSearchParams();
		params.append('username', 'testuser@example.com');
		params.append('password', 'Test.Password.123');
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		sessionCookie = response.headers.get('set-cookie')[0];
		expect(response.headers.get('set-cookie')).toBeDefined();
		expect(response.headers.get('set-cookie')).toMatch(/^connect\.sid/);
	});

});
