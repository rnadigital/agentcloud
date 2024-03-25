'use strict';

import { dynamicResponse } from '@dr';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createAccount from 'lib/account/create';
import { ObjectId } from 'mongodb';

import { Account, changeAccountPassword, getAccountByEmail, getAccountById, setCurrentTeam, setPlanDebug, verifyAccount } from '../db/account';
import { addVerification, getAndDeleteVerification,VerificationTypes } from '../db/verification';
import * as ses from '../lib/email/ses';

export async function accountData(req, res, _next) {
	//TODO: calculate and send the base64 of calcuated permissions for the resourceSlug here:
	return {
		team: res.locals.matchingTeam,
		csrf: req.csrfToken(),
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
 * @apiParam {String} password Password of account.
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
		const token = await jwt.sign({ accountId: account._id }, process.env.JWT_SECRET); //jwt
		req.session.token = token; //jwt (cookie)
		return dynamicResponse(req, res, 302, { redirect: `/${account.currentTeam.toString()}/playground`, token });
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

	if (!email || typeof email !== 'string' || email.length === 0 || !/^\S+@\S+\.\S+$/.test(email)
		|| !password || typeof password !== 'string' || password.length === 0
		|| !name || typeof name !== 'string' || name.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const existingAccount: Account = await getAccountByEmail(email);
	if (existingAccount) {
		return dynamicResponse(req, res, 409, { error: 'Account already exists with this email' });
	}

	const { emailVerified } = await createAccount(email, name, password);
	
	return dynamicResponse(req, res, 302, { redirect: emailVerified ? '/login?verifysuccess=true&noverify=1' : '/verify' });

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
 * POST /forms/account/requestchangepassword
 * send email with link to change password
 */
export async function requestChangePassword(req, res) {
	const { email } = req.body;
	if (!email || typeof email !== 'string' || email.length === 0 || !/^\S+@\S+\.\S+$/.test(email)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid email' });
	}
	const foundAccount = await getAccountByEmail(email);
	if (foundAccount) {
		addVerification(foundAccount._id, VerificationTypes.CHANGE_PASSWORD)
			.then(verificationToken => {
				ses.sendEmail({
					from: process.env.FROM_EMAIL_ADDRESS,
					bcc: null,
					cc: null,
					replyTo: null,
					to: [email],
					subject: 'Password reset verification',
					body: `Somebody entered your email a password reset for agentcloud.

If this was you, click the link to reset your password: "${process.env.URL_APP}/changepassword?token=${verificationToken}"

If you didn't request a password reset, you can safely ignore this email.`,
				});
			});
	}
	return dynamicResponse(req, res, 302, { redirect: '/verify' });
}

/**
 * POST /forms/account/changepassword
 * change password with token from email
 */
export async function changePassword(req, res) {
	const { password, token } = req.body;
	if (!token || typeof token !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid token' });
	}
	if (!password || typeof password !== 'string' || password.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	const deletedVerification = await getAndDeleteVerification(token, VerificationTypes.CHANGE_PASSWORD);
	if (!deletedVerification || !deletedVerification.token) {
		return dynamicResponse(req, res, 400, { error: 'Invalid password reset token' });
	}
	const newPasswordHash = await bcrypt.hash(password, 12);
	await changeAccountPassword(deletedVerification.accountId, newPasswordHash);
	return dynamicResponse(req, res, 302, { redirect: '/login?changepassword=true' });
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
	console.log('deletedVerification', deletedVerification);
	if (!deletedVerification || !deletedVerification.token) {
		return dynamicResponse(req, res, 400, { error: 'Invalid token' });
	}
	const foundAccount = await getAccountById(deletedVerification.accountId);
	console.log('deletedVerification', deletedVerification);
	console.log('foundAccount', foundAccount);
	if (!foundAccount.passwordHash) {
		const password = req.body.password;
		if (!password || typeof password !== 'string' || password.length === 0) {
			//Note: invite is invalidated at this point, but form is required so likelihood of legit issue is ~0
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		const newPasswordHash = await bcrypt.hash(password, 12);
		await changeAccountPassword(deletedVerification.accountId, newPasswordHash);
	}
	await verifyAccount(deletedVerification.accountId);
	return dynamicResponse(req, res, 302, { redirect: '/login?verifysuccess=true' });
}

/**
 * POST /forms/account/switchteam
 * switch teams
 */
export async function switchTeam(req, res, _next) {

	const { orgId, teamId, redirect } = req.body;
	if (!orgId || typeof orgId !== 'string'
		|| !teamId || typeof teamId !== 'string'
		|| (redirect && typeof redirect !== 'string')) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const switchOrg = res.locals.account.orgs.find(o => o.id.toString() === orgId);
	const switchTeam = switchOrg && switchOrg.teams.find(t => t.id.toString() === teamId);
	if (!switchOrg || !switchTeam) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await setCurrentTeam(res.locals.account._id, orgId, teamId);

	return res.json({ redirect: redirect || `/${teamId}/playground` });

}

async function dockerLogsData(containerId) {

	const response = await fetch(`http://localhost:2375/containers/${containerId}/logs?stdout=true&stderr=true&timestamps=true`);
	if (!response.ok) {
		throw new Error(`Error fetching logs for container ${containerId}: ${response.statusText}`);
	}
	const data = await response.text();
	return data.split('\n').filter(line => line).slice(-100);

}

export async function dockerLogsJson(req, res, next) {

	return res.json({});
// 	const containersResponse = await fetch('http://localhost:2375/containers/json');
// 	if (!containersResponse.ok) {
// 		throw new Error(`Error fetching containers list: ${containersResponse.statusText}`);
// 	}
// 	const containers = await containersResponse.json();
// 
// 	// Fetch logs from all containers
// 	const logsPromises = containers.map(container => dockerLogsData(container.Id));
// 	const logsArrays = await Promise.all(logsPromises);
// 
// 	// Flatten, sort by timestamp, and then join back into a single string
// 	const sortedLogs = logsArrays.flat().sort().join('\n');
// 	return res.json({ logs: sortedLogs });

}

export async function setPlanDebugApi(req, res, next) {

	const { plan } = req.body;

	setPlanDebug(res.locals.account._id, plan);

	return res.json({});

}
