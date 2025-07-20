'use strict';

import Permission from '@permission';
import { render } from '@react-email/render';
import bcrypt from 'bcrypt';
import { getSubscriptionsDetails } from 'controllers/stripe';
import { addAccount, OAuthRecordType } from 'db/account';
import { addOrg, setOrgStripeCustomerId, updateOrgStripeCustomer } from 'db/org';
import { addTeam } from 'db/team';
import { addVerification, VerificationTypes } from 'db/verification';
import debug from 'debug';
import InviteEmail from 'emails/Invite';
import VerificationEmail from 'emails/Verification';
import * as ses from 'lib/email/ses';
import StripeClient from 'lib/stripe';
import toObjectId from 'misc/toobjectid';
import { Binary, ObjectId } from 'mongodb';
import { OrgRoleKey, OrgRoles, REGISTERED_USER, TeamRoleKey, TeamRoles } from 'permissions/roles';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import { priceToPlanMap, SubscriptionPlan } from 'struct/billing';
import { InsertResult } from 'struct/db';
import { OAUTH_PROVIDER } from 'struct/oauth';

const log = debug('webapp:middleware:lib:account:create');

interface CreateAccountArgs {
	email: string;
	name: string;
	password?: string;
	roleTemplate?: TeamRoleKey | OrgRoleKey;
	invite?: boolean;
	provider?: OAUTH_PROVIDER;
	profileId?: string | number;
	checkoutSessionId?: string;
	teamName?: string;
	invitingTeamId?: string;
	invitingOrgId?: string;
}

export default async function createAccount({
	email,
	name,
	password,
	roleTemplate,
	invite,
	provider,
	profileId,
	checkoutSessionId,
	teamName,
	invitingTeamId,
	invitingOrgId
}: CreateAccountArgs): Promise<{
	emailVerified: boolean;
	addedAccount: InsertResult;
}> {
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
			[newAccountId.toString()]: new Binary(new Permission(OrgRoles.ORG_ADMIN.base64).array)
		}
	});
	const addedTeam = await addTeam({
		ownerId: newAccountId,
		name: `${name}'s Team`,
		orgId: addedOrg.insertedId,
		members: [newAccountId],
		dateCreated: new Date(),
		permissions: {
			// [newAccountId.toString()]: new Binary(new Permission(Roles[roleTemplate].base64).array),
			[newAccountId.toString()]: new Binary(new Permission(TeamRoles.TEAM_ADMIN.base64).array)
		}
	});
	const orgId = addedOrg.insertedId;
	const teamId = addedTeam.insertedId;

	// Create account and verification token to be sent in email
	const secretProvider = SecretProviderFactory.getSecretProvider();
	const amazonKey = await secretProvider.getSecret(SecretKeys.AMAZON_ACCESS_ID);
	//If there is no SES secret (email cant be sent) or this is an oauth login, don't require email verification.
	let emailVerified = amazonKey == null || profileId != null;
	const passwordHash = password ? await bcrypt.hash(password, 12) : null;
	const oauth = provider ? { [provider]: { id: profileId } } : ({} as OAuthRecordType);

	// get stripe secret
	const STRIPE_ACCOUNT_SECRET = await secretProvider.getSecret(SecretKeys.STRIPE_ACCOUNT_SECRET);

	// const oauth = provider ? { [provider as OAUTH_PROVIDER]: { id: profileId } } : {} as OAuthRecordType;
	const [addedAccount, verificationToken] = await Promise.all([
		addAccount({
			_id: newAccountId,
			name,
			email,
			passwordHash,
			orgs: [
				{
					id: orgId,
					name: `${name}'s Org`,
					ownerId: newAccountId,
					teams: [
						{
							id: teamId,
							name: `${name}'s Team`,
							ownerId: newAccountId
						}
					]
				}
			],
			currentOrg: toObjectId(invitingOrgId) || orgId,
			currentTeam: toObjectId(invitingTeamId) || teamId,
			emailVerified,
			oauth,
			permissions: new Binary(REGISTERED_USER.array),
			onboarded: false,
			dateCreated: new Date()
		}),
		addVerification(newAccountId, VerificationTypes.VERIFY_EMAIL),
		updateOrgStripeCustomer(orgId, {
			stripeCustomerId: null,
			stripePlan: process.env.SKIP_STRIPE ? SubscriptionPlan.ENTERPRISE : SubscriptionPlan.FREE,
			stripeAddons: {
				users: 0,
				storage: 0
			},
			stripeTrial: false
		})
	]);

	if (STRIPE_ACCOUNT_SECRET) {
		let foundCheckoutSession;
		if (checkoutSessionId) {
			emailVerified = false;
			log('Account creation attempted with checkoutSession %s', checkoutSessionId);
			//If passing a checkout session ID, try to fetch the customer ID and current sub details, and set it on the new account
			foundCheckoutSession = await StripeClient.get().checkout.sessions.retrieve(checkoutSessionId);
			const customerId = foundCheckoutSession?.customer as string;
			const { planItem, addonUsersItem, addonStorageItem } =
				await getSubscriptionsDetails(customerId);
			await setOrgStripeCustomerId(orgId, customerId);
			await updateOrgStripeCustomer(orgId, {
				stripePlan: priceToPlanMap[planItem.price.id],
				stripeAddons: {
					users: addonUsersItem ? addonUsersItem.quantity : 0,
					storage: addonStorageItem ? addonStorageItem.quantity : 0
				},
				stripeEndsAt: foundCheckoutSession?.current_period_end * 1000
			});
		}
		if (!foundCheckoutSession) {
			// Create Stripe customer
			const stripeCustomer = await StripeClient.get().customers.create({
				email,
				name
			});
			// Subscribe customer to 'Pro' plan with a trial
			const subscription = await StripeClient.get().subscriptions.create({
				customer: stripeCustomer.id,
				items: [{ price: process.env.STRIPE_PRO_PLAN_PRICE_ID }],
				trial_period_days: 7,
				trial_settings: {
					end_behavior: {
						missing_payment_method: 'pause'
					}
				}
			});
			log('Subscription created for new user: %O', subscription);
			await setOrgStripeCustomerId(orgId, stripeCustomer.id);
			await updateOrgStripeCustomer(orgId, {
				stripePlan: priceToPlanMap[process.env.STRIPE_PRO_PLAN_PRICE_ID],
				stripeEndsAt: subscription.current_period_end * 1000,
				stripeTrial: true
			});
		}
	}

	//TODO: send a "welcome" email even if emailVerified is true/created from checkout session

	// If SES key is present, send verification email else set emailVerified to true
	if (!emailVerified) {
		const emailBody = invite
			? await render(
					InviteEmail({
						inviteURL: `${process.env.URL_APP}/verify?token=${verificationToken}&newpassword=true`,
						name,
						teamName
					})
				)
			: await render(
					VerificationEmail({
						verificationURL: `${process.env.URL_APP}/verify?token=${verificationToken}${checkoutSessionId ? '&newpassword=true&stripe=1' : !password ? '&newpassword=true' : ''}`
					})
				);

		await ses.sendEmail({
			from: process.env.FROM_EMAIL_ADDRESS,
			bcc: null,
			cc: null,
			replyTo: null,
			to: [email],
			subject: invite ? "You've been invited to Agentcloud 🎉" : 'Verify your email',
			body: emailBody
		});
	}

	return { emailVerified, addedAccount }; // Can add more to return if necessary
}
