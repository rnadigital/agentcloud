'use strict';

import Permission from '@permission';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import bcrypt from 'bcrypt';
import { addAccount,OAuthRecordType } from 'db/account';
import { addOrg } from 'db/org';
import { addTeam } from 'db/team';
import { addVerification,VerificationTypes } from 'db/verification';
import * as ses from 'lib/email/ses';
import { Binary, ObjectId } from 'mongodb';
import Permissions from 'permissions/permissions';
import Roles from 'permissions/roles';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import { InsertResult } from 'struct/db';
import { OAUTH_PROVIDER, OAuthStrategy } from 'struct/oauth';
import { SubscriptionPlan } from 'struct/billing';

export default async function createAccount(email: string, name: string, password: string, invite?: boolean, provider?: OAUTH_PROVIDER, profileId?: string | number)
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
	const oauth = provider ? { [provider as OAUTH_PROVIDER]: { id: profileId } } : {} as OAuthRecordType;
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
				}]
			}],
			currentOrg: orgId,
			currentTeam: teamId,
			emailVerified,
			oauth,
			permissions: new Binary(Roles.REGISTERED_USER.array),
			stripe: {
				stripeCustomerId: null,
				stripePlan: SubscriptionPlan.FREE,
			}
		}),
		addVerification(newAccountId, VerificationTypes.VERIFY_EMAIL)
	]);

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

	return { emailVerified, addedAccount }; //Can add more to return if necessary

}
