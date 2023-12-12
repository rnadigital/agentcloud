'use strict';

import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { OAuthRecordType, setCurrentTeam, getAccountByEmail, changeAccountPassword, addAccount, Account, verifyAccount } from '../db/account';
import { addTeam } from '../db/team';
import { addOrg } from '../db/org';
import { VerificationTypes, addVerification, getAndDeleteVerification } from '../db/verification';
import { dynamicResponse } from '../util';
import jwt from 'jsonwebtoken';
import * as ses from '../lib/email/ses';
import SecretKeys from '../lib/secret/secretkeys';
import { getSecret } from '../lib/secret/secretmanager';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import toObjectId from 'misc/toobjectid';

export async function accountData(req, res, _next) {
	return {
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
		const token = await jwt.sign({ accountId: account._id }, process.env.JWT_SECRET); //jwt
		req.session.token = token; //jwt (cookie)
		return dynamicResponse(req, res, 302, { redirect: `/${account.currentTeam.toString()}/sessions`, token });
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

	const passwordHash = await bcrypt.hash(req.body.password, 12);

	const amazonKey = await getSecret(SecretKeys.AMAZON_ACCESSKEYID);
	const emailVerified = amazonKey == null;

	const newAccountId = new ObjectId();
	let airbyteWorkspaceId = null;
	if (process.env.AIRBYTE_USERNAME) {
		const workspaceApi = await getAirbyteApi(AirbyteApiType.WORKSPACES);
		const workspace = await workspaceApi.createWorkspace(null, {
			name: newAccountId.toString(), // account _id stringified as workspace name
		}).then(res => res.data);
		airbyteWorkspaceId = workspace.workspaceId;
	}
	const addedOrg = await addOrg({
		name: 'My Org',
		teamIds: [],
		members: [newAccountId],
	});
	const addedTeam = await addTeam({ //TODO: create with workspaceId of airbyte
		name: 'My Team',
		orgId: addedOrg.insertedId,
		members: [newAccountId],
		airbyteWorkspaceId,
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
					name: 'My Team',
					airbyteWorkspaceId,
				}]
			}],
			currentOrg: orgId,
			currentTeam: teamId,
			emailVerified,
			oauth: {} as OAuthRecordType,
		}),
		addVerification(newAccountId, VerificationTypes.VERIFY_EMAIL)
	]);

	if (!emailVerified) {
		await ses.sendEmail({
			from: process.env.FROM_EMAIL_ADDRESS,
			bcc: null,
			cc: null,
			replyTo: null,
			to: [email],
			subject: 'Verify your email',
			body: `Verify your email: ${process.env.URL_APP}/verify?token=${verificationToken}`,
		});
	}

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

If this was you, click the link to reset your password: ${process.env.URL_APP}/changepassword?token=${verificationToken}

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
	if (!req.body || !req.body.token || typeof req.body.token !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid token' });
	}
	const password = req.body.password;
	if (!password || typeof password !== 'string' || password.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	const deletedVerification = await getAndDeleteVerification(req.body.token, VerificationTypes.CHANGE_PASSWORD);
	if (!deletedVerification || !deletedVerification.token) {
		return dynamicResponse(req, res, 400, { error: 'Invalid password reset token' });
	}
	const newPasswordHash = await bcrypt.hash(req.body.password, 12);
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
	if (!deletedVerification || !deletedVerification.token) {
		return dynamicResponse(req, res, 400, { error: 'Invalid token' });
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

	return res.json({ redirect: redirect || `/${teamId}/sessions` });

}
