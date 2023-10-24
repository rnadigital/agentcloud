'use strict';

import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { getAccountByEmail, addAccount, Account, verifyAccount } from '../db/account';
import { addTeam } from '../db/team';
import { addOrg } from '../db/org';
import { VerificationTypes, addVerification, getAndDeleteVerification } from '../db/verification';
import { dynamicResponse } from '../util';
import jwt from 'jsonwebtoken';
import * as ses from '../lib/email/ses';
import SecretKeys from '../lib/secret/secretkeys';
import { getSecret } from '../lib/secret/secretmanager';

export async function accountData(req, res, _next) {
	//const data = await calling an api
	return {
		csrf: req.csrfToken(),
		//data,
	};
};

/**
 * GET /account
 * account page html
 */
export async function accountPage(app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/account');
}

export async function socketTestPage(app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/socket');
}

/**
 * GET /account.json
 * account page json data
 */
export async function accountJson(req, res, next) {
	const data = await accountData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * @api {post} /forms/account/login Login
 * @apiName login
 * @apiGroup Account
 *
 * @apiParam {String} username Username of account.
 * @apiParam {String} password Password of account..
 */
export async function login(req, res) {
	const email = req.body.email.toLowerCase();
	const password = req.body.password;
	const account: Account = await getAccountByEmail(email);
	if (!account) {
		return dynamicResponse(req, res, 403, { error: 'Incorrect email or password' });
	}
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);
	if (passwordMatch === true) {
		const token = await jwt.sign({ accountId: account._id }, process.env.JWT_SECRET);	//jwt
		req.session.token = token;																				//jwt (cookie)
		return dynamicResponse(req, res, 302, { redirect: '/account', token });
	}
	return dynamicResponse(req, res, 403, { error: 'Incorrect email or password' });
}

/**
 * POST /forms/account/register
 * regiser
 */
export async function register(req, res) {

	const email = req.body.email.toLowerCase();
	const name = req.body.name;
	const password = req.body.password;
	const rPassword = req.body.repeat_password;

	if (!email || typeof email !== 'string' || email.length === 0 || !/^\S+@\S+\.\S+$/.test(email)
		|| !password || typeof password !== 'string' || password.length === 0
		|| !name || typeof name !== 'string' || name.length === 0
		|| !rPassword || typeof rPassword !== 'string' || rPassword.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (password !== rPassword) {
		return dynamicResponse(req, res, 400, { error: 'Passwords did not match' });
	}

	const existingAccount: Account = await getAccountByEmail(email);
	if (existingAccount) {
		return dynamicResponse(req, res, 409, { error: 'Account already exists with this email' });
	}

	const passwordHash = await bcrypt.hash(req.body.password, 12);

	const amazonKey = await getSecret(SecretKeys.AMAZON_ACCESSKEYID);
	const emailVerified = amazonKey == null;

	const newAccountId = new ObjectId();
	const addedOrg = await addOrg({
		name: 'My Org',
		teamIds: [],
		members: [newAccountId],
	});
	const addedTeam = await addTeam({
		name: 'My Team',
		orgId: addedOrg.insertedId,
		members: [newAccountId],
	});
	const orgId = addedOrg.insertedId;
	const teamId = addedTeam.insertedId;
	const [addedAccount, verificationToken] = await Promise.all([
		addAccount({
			_id: newAccountId,
			name,
			email: email,
			passwordHash: passwordHash,
			orgs: [{
				id: orgId,
				name: 'My Org',
				teams: [{
					id: teamId,
					name: 'My Team'
				}]
			}],
			currentOrg: orgId,
			currentTeam: teamId,
			emailVerified,
		}),
		addVerification(newAccountId, VerificationTypes.VERIFY_EMAIL)
	]);

	console.log('verificationToken', verificationToken);

	//TODO: format the verificationToken
	if (!emailVerified) {
		await ses.sendEmail({
			from: 'noreply@agentcloud.dev',
			bcc: null,
			cc: null,
			replyTo: null,
			to: [email],
			subject: 'Verify your email',
			body: `Verify your email: ${process.env.URL_APP}/verify?token=${verificationToken}`,
		});
	}

	return dynamicResponse(req, res, 302, { redirect: emailVerified ? '/login?verifysuccess=true' : '/verify' });

}

/**
 * POST /forms/account/logout
 * logout
 */
export function logout(req, res) {
	req.session.destroy();
	return dynamicResponse(req, res, 302, { redirect: '/login' });
}

/**
 * POST /forms/account/changepassword
 * logout
 */
export function changePassword(req, res) {
	//TODO: password email reset sending, creating reset token, etc
	return dynamicResponse(req, res, 400, { error: 'Not implemented' });
}

/**
 * POST /forms/account/verify
 * logout
 */
export async function verifyToken(req, res) {
	if (!req.body || !req.body.token || typeof req.body.token !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid token' });
	}
	const deletedVerification = await getAndDeleteVerification(req.body.token, VerificationTypes.VERIFY_EMAIL);
	if (!deletedVerification || !deletedVerification.token) {
		return dynamicResponse(req, res, 400, { error: 'Invalid token' });
	}
	await verifyAccount(deletedVerification.accountId);
	return dynamicResponse(req, res, 302, { redirect: '/login?verifysuccess=true' });
}
