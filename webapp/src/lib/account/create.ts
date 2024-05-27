'use strict';

import Permission from '@permission';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import bcrypt from 'bcrypt';
import { getSubscriptionsDetails } from 'controllers/stripe';
import { addAccount, OAuthRecordType, setStripeCustomerId,setStripePlan, updateStripeCustomer } from 'db/account';
import { addOrg } from 'db/org';
import { addTeam } from 'db/team';
import { addVerification, VerificationTypes } from 'db/verification';
import debug from 'debug';
import * as ses from 'lib/email/ses';
import { stripe } from 'lib/stripe';
import { Binary, ObjectId } from 'mongodb';
import Permissions from 'permissions/permissions';
import Roles, { RoleKey } from 'permissions/roles';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import { priceToPlanMap,SubscriptionPlan } from 'struct/billing';
import { InsertResult } from 'struct/db';
import { OAUTH_PROVIDER } from 'struct/oauth';
const log = debug('webapp:middleware:lib:account:create');

export default async function createAccount(
	email: string,
	name: string,
	password: string,
	roleTemplate: RoleKey,
	invite?: boolean,
	provider?: OAUTH_PROVIDER,
	profileId?: string | number,
	checkoutSession?: string)
	: Promise<{ emailVerified: boolean; addedAccount: InsertResult; }> {

	// Create mongo id or new account
	const newAccountId = new ObjectId();

	// Create default org and team for account
	const addedOrg = await addOrg({
		ownerId: newAccountId,
		name: `${name}'s Org`,
		teamIds: [],
		members: [newAccountId],
		dateCreated: new Date(),
		permissions: {
			[newAccountId.toString()]: new Binary(new Permission(Roles.ORG_ADMIN.base64).array),
		},
	});
	const addedTeam = await addTeam({
		ownerId: newAccountId,
		name: `${name}'s Team`,
		orgId: addedOrg.insertedId,
		members: [newAccountId],
		dateCreated: new Date(),
		permissions: {
			// [newAccountId.toString()]: new Binary(new Permission(Roles[roleTemplate].base64).array),
			[newAccountId.toString()]: new Binary(new Permission(Roles.TEAM_ADMIN.base64).array),
		},
	});
	const orgId = addedOrg.insertedId;
	const teamId = addedTeam.insertedId;

	// Create account and verification token to be sent in email
	const secretProvider = SecretProviderFactory.getSecretProvider();
	const amazonKey = await secretProvider.getSecret(SecretKeys.AMAZON_ACCESS_ID);
	const emailVerified = amazonKey == null;
	const passwordHash = password ? (await bcrypt.hash(password, 12)) : null;
	const oauth = provider ? { [provider]: { id: profileId } } : {} as OAuthRecordType;
	// const oauth = provider ? { [provider as OAUTH_PROVIDER]: { id: profileId } } : {} as OAuthRecordType;
	const [addedAccount, verificationToken] = await Promise.all([
		addAccount({
			_id: newAccountId,
			name,
			email,
			passwordHash,
			orgs: [{
				id: orgId,
				name: `${name}'s Org`,
				ownerId: newAccountId,
				teams: [{
					id: teamId,
					name: `${name}'s Team`,
					ownerId: newAccountId,
				}],
			}],
			currentOrg: orgId,
			currentTeam: teamId,
			emailVerified,
			oauth,
			permissions: new Binary(Roles.REGISTERED_USER.array),
			stripe: {
				stripeCustomerId: null,
				stripePlan: process.env['STRIPE_ACCOUNT_SECRET'] ? SubscriptionPlan.FREE : SubscriptionPlan.ENTERPRISE,
				stripeAddons: {
					users: 0,
					storage: 0,
				},
				stripeTrial: false,
			},
		}),
		addVerification(newAccountId, VerificationTypes.VERIFY_EMAIL),
	]);

	if (process.env['STRIPE_ACCOUNT_SECRET']) {
		let foundCheckoutSession;
		if (checkoutSession) {
			log('Account creation attempted with checkoutSession %s', checkoutSession);
			//If passing a checkout session ID, try to fetch the customer ID and current sub details, and set it on the new account
			foundCheckoutSession = await stripe.checkout.sessions.retrieve(checkoutSession);
			const customerId = foundCheckoutSession?.customer as string;
			const { planItem, addonUsersItem, addonStorageItem } = await getSubscriptionsDetails(customerId);
			await setStripeCustomerId(newAccountId, customerId);
			await updateStripeCustomer(customerId, {
				stripePlan: priceToPlanMap[planItem.price.id],
				stripeAddons: {
					users: addonUsersItem ? addonUsersItem.quantity : 0,
					storage: addonStorageItem ? addonStorageItem.quantity : 0,
				},
				stripeEndsAt: foundCheckoutSession?.current_period_end*1000,
			});
		}
		if (!foundCheckoutSession) {
			// Create Stripe customer
			const stripeCustomer = await stripe.customers.create({
				email,
				name,
			});
			// Subscribe customer to 'Pro' plan with a 30-day trial
			const subscription = await stripe.subscriptions.create({
				customer: stripeCustomer.id,
				items: [{ price: process.env.STRIPE_PRO_PLAN_PRICE_ID }],
				trial_period_days: 30,
			});
			log('Subscription created for new user: %O', subscription);
			await setStripeCustomerId(newAccountId, stripeCustomer.id);
			await updateStripeCustomer(stripeCustomer.id, {
				stripePlan: priceToPlanMap[process.env.STRIPE_PRO_PLAN_PRICE_ID],
				stripeEndsAt: subscription.current_period_end*1000,
				stripeTrial: true,
			});
		}
	}
		
	// If SES key is present, send verification email else set emailVerified to true
	if (!emailVerified) {
		await ses.sendEmail({
			from: process.env.FROM_EMAIL_ADDRESS,
			bcc: null,
			cc: null,
			replyTo: null,
			to: [email],
			subject: invite
				? 'You\'ve been invited to Agentcloud 🎉'
				: 'Verify your email',
			body: invite
				? `Click here to accept the invitation: ${process.env.URL_APP}/verify?token=${verificationToken}&newpassword=true`
				: `Verify your email: ${process.env.URL_APP}/verify?token=${verificationToken}`,
		});
	}

	return { emailVerified, addedAccount }; // Can add more to return if necessary
}

