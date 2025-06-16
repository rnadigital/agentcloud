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
	const newAccountId = new ObjectId();

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

	if (!addedOrg.insertedId) {
		throw new Error('Failed to create organization');
	}

	const addedTeam = await addTeam({
		ownerId: newAccountId,
		name: `${name}'s Team`,
		orgId: addedOrg.insertedId,
		members: [newAccountId],
		dateCreated: new Date(),
		permissions: {
			[newAccountId.toString()]: new Binary(new Permission(TeamRoles.TEAM_ADMIN.base64).array)
		}
	});

	if (!addedTeam.insertedId) {
		throw new Error('Failed to create team');
	}

	const orgId = addedOrg.insertedId;
	const teamId = addedTeam.insertedId;

	const secretProvider = SecretProviderFactory.getSecretProvider();
	const amazonKey = await secretProvider.getSecret(SecretKeys.AMAZON_ACCESS_ID);
	let emailVerified = amazonKey == null || profileId != null;
	const passwordHash = password ? await bcrypt.hash(password, 12) : null;
	const oauth = provider ? { [provider]: { id: profileId } } : ({} as OAuthRecordType);

	const STRIPE_ACCOUNT_SECRET = await secretProvider.getSecret(SecretKeys.STRIPE_ACCOUNT_SECRET);

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
			currentOrg: invitingOrgId ? toObjectId(invitingOrgId) : orgId,
			currentTeam: invitingTeamId ? toObjectId(invitingTeamId) : teamId,
			emailVerified,
			oauth,
			permissions: new Binary(REGISTERED_USER.array),
			onboarded: false,
			dateCreated: new Date()
		}),
		addVerification(newAccountId, VerificationTypes.VERIFY_EMAIL),
		updateOrgStripeCustomer(orgId, {
			stripeCustomerId: undefined,
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
			const stripeCustomer = await StripeClient.get().customers.create({
				email,
				name
			});
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
			const proPlanPriceId = process.env.STRIPE_PRO_PLAN_PRICE_ID;
			if (!proPlanPriceId) {
				throw new Error('STRIPE_PRO_PLAN_PRICE_ID is not defined');
			}
			await updateOrgStripeCustomer(orgId, {
				stripePlan: priceToPlanMap[proPlanPriceId],
				stripeEndsAt: subscription.current_period_end * 1000,
				stripeTrial: true
			});
		}
	}

	if (!emailVerified) {
		const emailBody = invite
			? await render(
					InviteEmail({
						inviteURL: `${process.env.URL_APP}/verify?token=${verificationToken}&newpassword=true`,
						name,
						teamName: teamName || ''
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

	return { emailVerified, addedAccount };
}
