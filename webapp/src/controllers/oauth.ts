'use strict';

import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import { Account, addAccount, getAccountByOAuthOrEmail, setAccountOauth } from 'db/account';
import debug from 'debug';
import createAccount from 'lib/account/create';
import { ObjectId } from 'mongodb';
import SecretKeys from 'secret/secretkeys';
import { CustomOAuthStrategy, OAUTH_PROVIDER, OAuthStrategy } from 'struct/oauth';

import { addOrg } from '../db/org';
import { addTeam } from '../db/team';
const log = debug('webapp:oauth');

//To reduce some boilerplace in the router, allows us to just loop and create handlers for each service
import { Strategy as CustomStrategy } from 'passport-custom';
import { Strategy as SalesforceStrategy } from 'passport-forcedotcom';
import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as HubspotStrategy } from 'passport-hubspot-oauth2';
import { Strategy as XeroStrategy } from 'passport-xero';
import { Strategy as SlackStrategy } from 'passport-slack';
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
	},
	// { strategy: StripeStrategy, secretKeys: { clientId: SecretKeys.OAUTH_STRIPE_CLIENT_ID, secret: SecretKeys.OAUTH_STRIPE_CLIENT_SECRET }, callback: stripeCallback, path: '/auth/stripe/callback', extra: { /* N/A */ } },
	{
		strategy: HubspotStrategy,
		secretKeys: {
			clientId: SecretKeys.OAUTH_HUBSPOT_CLIENT_ID,
			secret: SecretKeys.OAUTH_HUBSPOT_CLIENT_SECRET
		},
		callback: hubspotDatasourceCallback,
		path: '/auth/hubspot/callback',
		extra: {}
	},
	{
		strategy: SalesforceStrategy,
		secretKeys: {
			clientId: SecretKeys.OAUTH_SALESFORCE_CLIENT_ID,
			secret: SecretKeys.OAUTH_SALESFORCE_CLIENT_SECRET
		},
		callback: salesForceDatasourceCallback,
		path: '/auth/salesforce/callback',
		extra: {
			// for salesforce specifically scopes need to go here
			scope: [
				'full',
				'refresh_token'
			]
		}
	},
	{
		strategy: XeroStrategy,
		secretKeys: {
			clientId: SecretKeys.OAUTH_XERO_CLIENT_ID,
			secret: SecretKeys.OAUTH_XERO_CLIENT_SECRET
		},
		callback: xeroDatasourceCallback,
		path: '/auth/xero/callback',
		extra: {
			consumerKey: SecretKeys.OAUTH_XERO_CLIENT_ID,
			consumerSecret: SecretKeys.OAUTH_XERO_CLIENT_SECRET //xero has a different name for the clientId and clientSecret
		}
	},
	{
		strategy: SlackStrategy,
		secretKeys: {
			clientId: SecretKeys.OAUTH_SLACK_CLIENT_ID,
			secret: SecretKeys.OAUTH_SLACK_CLIENT_SECRET
		},
		callback: slackDatasourceCallback,
		path: '/auth/slack/callback',
		extra: {

		}
	}
	//need to add custom strategy for airtable
	//google ads??
];

export async function slackDatasourceCallback(accessToken, refreshToken, profile, done){
	const slackCallbackLog = debug("webapp:oauth:datasourceOauth:slack:callback");
	slackCallbackLog(`Got refreshToken ${refreshToken} from callback`);

	profile.refreshToken = refreshToken;

	done(null, profile);
}

export async function xeroDatasourceCallback(token, tokenSecret, profile, done) {
	//token is what's used by airbyte
	const xeroCallbackLog = debug('webapp:oauth:datasourceOauth:xero:callback');
	xeroCallbackLog(`Got access token: ${token} from callback\nAlso got tokenSecret: ${tokenSecret} (Maybe refreshToken?) from callback`);

	profile.refreshToken = token; //even though this isn't necessarily a refreshToken it's the token we need to pass back to airbyte so keep it like this

	done(null, profile);
}

export async function salesForceDatasourceCallback(accessToken, refreshToken, profile, done) {
	const salesForceCallbackLog = debug('webapp:oauth:datasourceoauth:salesforce:callback');
	salesForceCallbackLog(
		`Got refreshToken: ${refreshToken} \nAnd accessToken: ${accessToken} from callback`
	);

	profile.refreshToken = refreshToken;
	done(null, profile);
}

export async function hubspotDatasourceCallback(accessToken, refreshToken, profile, done) {
	console.log(`Hubspot datasource callback with refreshToken: ${refreshToken}`);
	//create the datasouce here, call done

	profile.refreshToken = refreshToken;
	done(null, profile);
}

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
	log('serializeHandler user', user?.id);
	log('serializeHandler user', user?.refreshToken);
	log('serializeHandler user', user?.provider);
	const newUser = { 
		oauthId: user?.id, 
		provider: user?.provider, 
		refreshToken: user?.refreshToken 
	};
	log(newUser);
	done(null, newUser);
}

export async function deserializeHandler(obj, done) {
	log('deserializeHandler obj', obj);
	const { oauthId, provider } = obj;

	// Special case for "airtable" provider
	if (provider === 'airtable') {
		log('Provider is "airtable", returning input object directly as user');
		return done(null, obj); // Return the input `obj` as the user object
	}

	// For other providers, use provider information to retrieve the user
	const account: Account = await getAccountByOAuthOrEmail(oauthId, provider, null);
	if (account) {
		const accountObj = {
			_id: account._id.toString(),
			name: account.name,
			email: account.email,
			orgs: account.orgs,
			currentOrg: account.currentOrg,
			currentTeam: account.currentTeam,
			token: account.token,
			stripe: account.stripe,
			oauth: account.oauth
		};
		return done(null, accountObj);
	}

	// If no account is found, return null
	log('No account found for oauthId:', oauthId, 'and provider:', provider);
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
