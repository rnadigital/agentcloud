'use strict';

import { dynamicResponse } from '@dr';
import { render } from '@react-email/components';
import bcrypt from 'bcrypt';
import {
	Account,
	changeAccountPassword,
	getAccountByEmail,
	getAccountById,
	setCurrentTeam,
	updateRoleAndMarkOnboarded,
	verifyAccount
} from 'db/account';
import { getTeamWithModels } from 'db/team';
import { addVerification, getAndDeleteVerification, VerificationTypes } from 'db/verification';
import PasswordResetEmail from 'emails/PasswordReset';
import jwt from 'jsonwebtoken';
import createAccount from 'lib/account/create';
import * as ses from 'lib/email/ses';
import StripeClient from 'lib/stripe';
import { chainValidations } from 'lib/utils/validationutils';
import Permissions from 'permissions/permissions';


/**
 * @swagger
 * /:
 *  get:
 *   summary: Returns all the account data
 *   responses:
 *    200:
 *     description: the list ofthe books content
 *     schema:
 *      type: array
 *      items:
 *       $ref: '#/components/schemas/Agent'
 */
export async function accountData(req, res, _next) {
	return {
		team: res.locals.matchingTeam,
		csrf: req.csrfToken()
	};
}

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
 * GET /billing
 * billing page html
 */
export async function billingPage(app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, '/billing');
}

export async function onboardingPage(app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/onboarding`);
}

export async function configureModelsPage(app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/onboarding/configuremodels`);
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
	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'email',
				validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
			},
			{ field: 'password', validation: { notEmpty: true, lengthMin: 1, ofType: 'string' } }
		],
		{ email: 'Email', password: 'Password' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const email = req.body.email.toLowerCase();
	const password = req.body.password;
	const account: Account = await getAccountByEmail(email);

	if (!account || (!account?.emailVerified && process.env.SKIP_EMAIL !== '1')) {
		return dynamicResponse(req, res, 403, { error: 'Incorrect email or password' });
	}

	try {
		const passwordMatch = await bcrypt.compare(password, account.passwordHash);

		if (passwordMatch === true) {
			const token = await jwt.sign({ accountId: account._id }, process.env.JWT_SECRET); //jwt
			req.session.token = token; //jwt (cookie)

			if (account.onboarded === false) {
				return dynamicResponse(req, res, 302, {
					redirect: `/${account.currentTeam.toString()}/onboarding`,
					token
				});
			}

			return dynamicResponse(req, res, 302, {
				redirect: `/${account.currentTeam.toString()}/apps`,
				token
			});
		}
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 403, { error: 'Incorrect email or password' });
	}

	return dynamicResponse(req, res, 403, { error: 'Incorrect email or password' });
}

/**
 * POST /forms/account/register
 * regiser
 */
export async function register(req, res) {
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{
				field: 'email',
				validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
			},
			{ field: 'password', validation: { notEmpty: true, lengthMin: 1, ofType: 'string' } }
		],
		{ name: 'Name', email: 'Email', password: 'Password' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const email = req.body.email.toLowerCase();
	const { name, password } = req.body;

	const existingAccount: Account = await getAccountByEmail(email);
	if (existingAccount) {
		return dynamicResponse(req, res, 409, { error: 'Account already exists with this email' });
	}

	const { emailVerified } = await createAccount({
		email,
		name,
		password,
		roleTemplate: 'TEAM_MEMBER'
	});

	return dynamicResponse(req, res, 302, {
		redirect: emailVerified ? '/login?verifysuccess=true&noverify=1' : '/verify'
	});
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

	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'email',
				validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
			}
		],
		{ email: 'Email' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const foundAccount = await getAccountByEmail(email);
	if (foundAccount) {
		addVerification(foundAccount._id, VerificationTypes.CHANGE_PASSWORD).then(verificationToken => {
			const emailBody = render(
				PasswordResetEmail({
					passwordResetURL: `${process.env.URL_APP}/changepassword?token=${verificationToken}`
				})
			);

			ses.sendEmail({
				from: process.env.FROM_EMAIL_ADDRESS,
				bcc: null,
				cc: null,
				replyTo: null,
				to: [email],
				subject: 'Password reset verification',
				body: emailBody
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
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'token', validation: { notEmpty: true, lengthMin: 1, ofType: 'string' } },
			{ field: 'password', validation: { notEmpty: true, lengthMin: 1, ofType: 'string' } }
		],
		{ name: 'Name', email: 'Email', password: 'Password' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}
	const deletedVerification = await getAndDeleteVerification(
		token,
		VerificationTypes.CHANGE_PASSWORD
	);
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
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'token', validation: { ofType: 'string' } },
			{ field: 'checkoutsession', validation: { ofType: 'string' } }
		],
		{ token: 'Token', checkoutsession: 'Checkout Session ID' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}
	const { password, token, checkoutsession } = req.body;
	let deletedVerification;
	if (token) {
		deletedVerification = await getAndDeleteVerification(
			req.body.token,
			VerificationTypes.VERIFY_EMAIL
		);
	}
	let accountId = deletedVerification?.accountId;
	let stripeCustomerId;
	let foundCheckoutSession;
	if ((!deletedVerification || !deletedVerification?.token || !accountId) && checkoutsession) {
		// StripeInvalidRequestError: Invalid string: 34cc47ea5d...bbe94fe52b; must be at most 66 characters
		const checkoutSessionId = checkoutsession;
		try {
			foundCheckoutSession = await StripeClient.get().checkout.sessions.retrieve(checkoutSessionId);
		} catch (e) {
			return dynamicResponse(req, res, 400, { error: 'Invalid token' });
		}
		if (!foundCheckoutSession || foundCheckoutSession.status !== 'complete') {
			return dynamicResponse(req, res, 400, { error: 'Invalid token' });
		}
		const stripeCustomerId = foundCheckoutSession?.customer;
		// Retrieve customer details from Stripe
		const stripeCustomer = await StripeClient.get().customers.retrieve(stripeCustomerId);
		if (!stripeCustomer) {
			return dynamicResponse(req, res, 400, { error: 'Customer not found' });
		}
		const { email } = stripeCustomer;
		// Get the custom name field from metadata
		const customName = foundCheckoutSession?.custom_fields?.length
			? foundCheckoutSession.custom_fields[0]?.text?.value
			: null;
		if (customName) {
			// Update the customer's name in Stripe with the custom name
			await StripeClient.get().customers.update(stripeCustomerId, { name: customName });
		}
		const emailAccount = await getAccountByEmail(email);
		if (emailAccount) {
			return dynamicResponse(req, res, 400, { error: 'Account already exists' });
		}
		const { addedAccount } = await createAccount({
			email,
			name: customName || email, // fallback to emali if name not found on checkoutsession
			password,
			roleTemplate: 'TEAM_MEMBER',
			checkoutSessionId
		});
		if (!addedAccount.insertedId) {
			return dynamicResponse(req, res, 400, { error: 'Account creation error' });
		}
		return dynamicResponse(req, res, 200, {});
	}
	const foundAccount = await getAccountById(accountId);
	if (!foundAccount) {
		return dynamicResponse(req, res, 400, { error: 'Account already verified or not found' });
	}
	if (!foundAccount.passwordHash) {
		if (!password || typeof password !== 'string' || password.length === 0) {
			//Note: invite is invalidated at this point, but form is required so likelihood of legit issue is ~0
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		const newPasswordHash = await bcrypt.hash(password, 12);
		await changeAccountPassword(accountId, newPasswordHash);
	}
	await verifyAccount(accountId);
	return dynamicResponse(req, res, 302, { redirect: '/login?verifysuccess=true' });
}

/**
 * POST /forms/account/switchteam
 * switch teams
 */
export async function switchTeam(req, res, _next) {
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'orgId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } },
			{ field: 'teamId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }
		],
		{ orgId: 'Org ID', teamId: 'Team ID' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { orgId, teamId } = req.body;

	const switchOrg = res.locals.account.orgs.find(o => o.id.toString() === orgId);
	const switchTeam = switchOrg && switchOrg.teams.find(t => t.id.toString() === teamId);
	if (!switchOrg || !switchTeam) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const canCreateModel = res.locals.permissions.get(Permissions.CREATE_MODEL);
	const teamData = await getTeamWithModels(teamId);

	await setCurrentTeam(res.locals.account._id, orgId, teamId);

	return res.json({ canCreateModel, teamData });
}

export async function updateRole(req, res) {
	const { role } = req.body;
	const userId = res.locals.account._id;
	await updateRoleAndMarkOnboarded(userId, role);
	const canCreateModel = res.locals.permissions.get(Permissions.CREATE_MODEL);

	const teamData = await getTeamWithModels(res.locals.account.currentTeam);

	if (canCreateModel && (!teamData.llmModel || !teamData.embeddingModel)) {
		return dynamicResponse(req, res, 302, {
			redirect: `/${res.locals.account.currentTeam.toString()}/onboarding/configuremodels`
		});
	}

	return dynamicResponse(req, res, 302, {
		redirect: `/${res.locals.account.currentTeam.toString()}/apps`
	});
}
