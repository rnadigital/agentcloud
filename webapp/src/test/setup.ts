import {describe, expect, test} from '@jest/globals';
import * as db from 'db/index';
import { deleteAccountByEmail } from 'db/account';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config({ path: '.env' });
let sessionCookie: string;
let csrfToken: string;


beforeAll(async () => {
	await db.connect();
	await db.db().collection('accounts').deleteOne({ email: 'testuser@example.com' });
});

describe('Register and login', () => {

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
		expect(response.status).toBe(302);
		expect(response.headers.get('set-cookie')).toBeDefined();
	});

	test('login as new user', async () => {
		const params = new URLSearchParams();
		params.append('email', 'testuser@example.com');
		params.append('password', 'Test.Password.123');
		const response = await fetch(`${process.env.WEBAPP_TEST_BASE_URL}/forms/account/login`, {
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		sessionCookie = response.headers.get('set-cookie');
		expect(response.headers.get('set-cookie')).toBeDefined();
		expect(response.headers.get('set-cookie')).toMatch(/^connect\.sid/);
	});

});

