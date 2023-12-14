'use strict';

import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { addAccount, getAccountByOAuthOrEmail, Account, setAccountOauth } from '../db/account';
import { ObjectId } from 'mongodb';
import { addTeam } from '../db/team';
import { addOrg } from '../db/org';
import { OAUTH_PROVIDER } from 'struct/oauth';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import debug from 'debug';
const log = debug('webapp:oauth');

//TODO: move these to lib/struct/oauth?
export type Strategy = {
	strategy: any;
	callback: Function;
	env: string;
	path: string;
	extra?: any; // Stuff like scope (this object is a different shape depending on provider hence any)
}

//To reduce some boilerplace in the router, allows us to just loop and create handlers for each service
export const OAUTH_STRATEGIES: Strategy[] = [
	{ strategy: GitHubStrategy, env: 'GITHUB', callback: githubCallback, path: '/auth/github/callback', extra: { scope: ['user:email'] } },
	{ strategy: GoogleStrategy, env: 'GOOGLE', callback: googleCallback, path: '/auth/google/callback', extra: { /* google doesnt need yet */ } },
	//TODO: add more here if desired?
];

// GitHub callback handler
export async function githubCallback(accessToken, refreshToken, profile, done) {
	log(`githubCallback profile: ${JSON.stringify(profile, null, '\t')}`);

	const emails = await fetch('https://api.github.com/user/emails', {
		headers: {
			'User-Agent': 'Agentcloud',
			'Authorization': `token ${accessToken}`,
		}
	}).then(res => res.json());
	const primaryEmail = emails.find(email => (email.primary && email.verified)).email;
	profile.provider = OAUTH_PROVIDER.GITHUB;
	profile.email = primaryEmail;

	/*TODO: refactor so this account/default team creation code isnt
	repeated in both oauth handlers and account register controller */
	const account: Account = await getAccountByOAuthOrEmail(profile.id, profile.provider, profile.email);
	log('githubCallback account', account);
	if (!account) {
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
		const addedTeam = await addTeam({
			name: 'My Team',
			orgId: addedOrg.insertedId,
			members: [newAccountId],
			airbyteWorkspaceId,
		});
		const orgId = addedOrg.insertedId;
		const teamId = addedTeam.insertedId;
		await addAccount({
			_id: newAccountId,
			name: profile.displayName || profile.email,
			email: profile.email,
			passwordHash: null,
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
			emailVerified: true,
			oauth: {
				[profile.provider as OAUTH_PROVIDER]: { id: profile.id },
			},
		});
	} else {
		//existing account, check if it has the oauth ID else update it
		if (!account.oauth || !account.oauth[profile.provider]) {
			await setAccountOauth(account._id, profile.id, profile.provider);
		}
	}

	done(null, profile);
}

// Google callback handler
export async function googleCallback(accessToken, refreshToken, profile, done) {
	log(`googleCallback profile: ${JSON.stringify(profile, null, '\t')}`);

	const verifiedEmail = profile.emails.find(e => e.verified === true).value;
	profile.provider = OAUTH_PROVIDER.GOOGLE;
	profile.email = verifiedEmail;

	/*TODO: refactor so this account/default team creation code isnt
	repeated in both oauth handlers and account register controller */
	const account: Account = await getAccountByOAuthOrEmail(profile.id, profile.provider, profile.email);
	if (!account) {
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
		const addedTeam = await addTeam({
			name: 'My Team',
			orgId: addedOrg.insertedId,
			members: [newAccountId],
			airbyteWorkspaceId,
		});
		const orgId = addedOrg.insertedId;
		const teamId = addedTeam.insertedId;
		await addAccount({
			_id: newAccountId,
			name: profile.displayName || verifiedEmail,
			email: verifiedEmail,
			passwordHash: null,
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
			emailVerified: true, //redundant in oauth?
			oauth: {
				[profile.provider as OAUTH_PROVIDER]: { id: profile.id },
			},
		});
	} else {
		//existing account, check if it has the oauth ID else update it
		if (!account.oauth || !account.oauth[profile.provider]) {
			await setAccountOauth(account._id, profile.id, profile.provider);
		}
	}

	done(null, profile);
}

export async function serializeHandler(user, done) {
	log('serializeHandler user', user);
	done(null, { oauthId: user.id, provider: user.provider });
}

export async function deserializeHandler(obj, done) {
	log('deserializeHandler obj', obj);

	const { oauthId, provider } = obj;

    // Use provider information to retrieve the user e.g.
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
			stripeCustomerId: account.stripeCustomerId,
			stripeEndsAt: account.stripeEndsAt,
			stripeCancelled: account.stripeCancelled,
			oauth: account.oauth,
		};
		return done(null, accountObj);
	}

	done(null, null);

}
