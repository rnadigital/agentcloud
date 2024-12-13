'use strict';

import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import { Account, addAccount, getAccountByOAuthOrEmail, setAccountOauth } from 'db/account';
import debug from 'debug';
import createAccount from 'lib/account/create';
import { ObjectId } from 'mongodb';
import SecretKeys from 'secret/secretkeys';
import { OAUTH_PROVIDER, OAuthStrategy } from 'struct/oauth';

import { addOrg, getOrgById, Org } from '../db/org';
import { addTeam } from '../db/team';
const log = debug('webapp:oauth');

//To reduce some boilerplace in the router, allows us to just loop and create handlers for each service
import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as HubspotStrategy } from 'passport-hubspot-oauth2';
// import { Strategy as StripeStrategy } from 'passport-stripe';

export const OAUTH_STRATEGIES: OAuthStrategy[] = [
	{
		strategy: GitHubStrategy,
		secretKeys: {
			clientId: SecretKeys.OAUTH_GITHUB_CLIENT_ID,
			secret: SecretKeys.OAUTH_GITHUB_CLIENT_SECRET
		},
		callback: githubCallback,
		path: '/auth/github/callback',
		extra: { scope: ['user:email'] }
	},
	{
		strategy: GoogleStrategy,
		secretKeys: {
			clientId: SecretKeys.OAUTH_GOOGLE_CLIENT_ID,
			secret: SecretKeys.OAUTH_GOOGLE_CLIENT_SECRET
		},
		callback: googleCallback,
		path: '/auth/google/callback',
		extra: {
			/* N/A */
		}
	}
	// { strategy: StripeStrategy, secretKeys: { clientId: SecretKeys.OAUTH_STRIPE_CLIENT_ID, secret: SecretKeys.OAUTH_STRIPE_CLIENT_SECRET }, callback: stripeCallback, path: '/auth/stripe/callback', extra: { /* N/A */ } },
	// { strategy: HubspotStrategy, secretKeys: { clientId: SecretKeys.OAUTH_HUBSPOT_CLIENT_ID, secret: SecretKeys.OAUTH_HUBSPOT_CLIENT_SECRET }, callback: hubspotCallback, path: '/auth/hubspot/callback', extra: { /* N/A */ } },
];

export async function githubCallback(accessToken, refreshToken, profile, done) {
	log(`githubCallback profile: ${JSON.stringify(profile, null, '\t')}`);
	const emails = await fetch('https://api.github.com/user/emails', {
		headers: {
			'User-Agent': 'Agentcloud',
			Authorization: `token ${accessToken}`
		}
	}).then(res => res.json());
	const primaryEmail = emails.find(email => email.primary && email.verified).email;
	profile.provider = OAUTH_PROVIDER.GITHUB;
	profile.email = primaryEmail;
	const account: Account = await getAccountByOAuthOrEmail(
		profile.id,
		profile.provider,
		profile.email
	);
	log('githubCallback account', account);
	await createUpdateAccountOauth(
		account,
		profile.email,
		profile.displayName,
		profile.provider,
		profile.id
	);
	done(null, profile);
}

export async function googleCallback(accessToken, refreshToken, profile, done) {
	log(`googleCallback profile: ${JSON.stringify(profile, null, '\t')}`);
	const verifiedEmail = profile.emails.find(e => e.verified === true).value;
	profile.provider = OAUTH_PROVIDER.GOOGLE;
	profile.email = verifiedEmail;
	const account: Account = await getAccountByOAuthOrEmail(
		profile.id,
		profile.provider,
		profile.email
	);
	log('googleCallback account', account);
	await createUpdateAccountOauth(
		account,
		verifiedEmail,
		profile.displayName,
		profile.provider,
		profile.id
	);
	done(null, profile);
}

// export async function stripeCallback(accessToken, refreshToken, profile, done) {
// 	log(`stripeCallback profile: ${JSON.stringify(profile, null, '\t')}`);
// 	done(null, profile);
// }

// export async function hubspotCallback(accessToken, refreshToken, profile, done) {
// 	log(`hubspotCallback profile: ${JSON.stringify(profile, null, '\t')}`);
// 	done(null, profile);
// }

export async function serializeHandler(user, done) {
	log('serializeHandler user', user);
	done(null, { oauthId: user.id, provider: user.provider });
}

export async function deserializeHandler(obj, done) {
	log('deserializeHandler obj', obj);
	const { oauthId, provider } = obj;
	// Use provider information to retrieve the user e.g.
	const account: Account = await getAccountByOAuthOrEmail(oauthId, provider, null);
	const org: Org = await getOrgById(account.currentOrg);
	if (account) {
		const accountObj = {
			_id: account._id.toString(),
			name: account.name,
			email: account.email,
			orgs: account.orgs,
			currentOrg: account.currentOrg,
			currentTeam: account.currentTeam,
			token: account.token,
			stripe: org.stripe,
			oauth: account.oauth
		};
		return done(null, accountObj);
	}
	done(null, null);
}

async function createUpdateAccountOauth(account, email, name, provider, profileId) {
	if (!account) {
		await createAccount({
			email,
			name: name || email,
			roleTemplate: 'TEAM_MEMBER',
			provider,
			profileId
		});
	} else {
		//existing account, check if it has the oauth ID else update it
		if (!account.oauth || !account.oauth[provider]) {
			await setAccountOauth(account._id, profileId, provider);
		}
	}
}
