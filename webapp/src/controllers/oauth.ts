import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Account } from '../db/account';
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

export enum OAUTH_PROVIDER {
	GOOGLE = 'google',
	GITHUB = 'github',
}

//To reduce some boilerplace in the router, allows us to just loop and create handlers for each service
export const OAUTH_STRATEGIES: Strategy[] = [
	{ strategy: GitHubStrategy, env: 'GITHUB', callback: githubCallback, path: '/auth/github/callback', extra: { scope: ['user:email'] } },
	{ strategy: GoogleStrategy, env: 'GOOGLE', callback: googleCallback, path: '/auth/google/callback' },
	//TODO: add more here if desired?
];

// GitHub callback handler
export async function githubCallback(accessToken, refreshToken, profile, done) {
	log(`githubCallback profile: ${JSON.stringify(profile, null, '\t')}`);

	//1. find account by oauth.github.id:
	//2. if not exist, create
	
	profile.provider = OAUTH_PROVIDER.GITHUB;
	done(null, profile);
}

// Google callback handler
export async function googleCallback(accessToken, refreshToken, profile, done) {
	log(`googleCallback profile: ${JSON.stringify(profile, null, '\t')}`);

	//1. find account by oauth.google.id:
	//2. if not exist, create

	profile.provider = OAUTH_PROVIDER.GOOGLE;
	done(null, profile);
}

export async function serializeHandler(user, done) {
	log(`serializeHandler user: ${JSON.stringify(user, null, '\t')}`);

	//TODO: When serializing the user, store both the user ID and the provider name in the session.
	
	done(null, { oauthId: user.id, provider: user.provider });
}

export async function deserializeHandler(obj, done) {
	log(`deserializeHandler obj: ${JSON.stringify(obj, null, '\t')}`);

	const { oauthId, provider } = obj;

    // Use provider information to retrieve the user e.g.
	// const account: Account = await getAccountByOauthId(oauthId, provider);
	// if (account) {
	// 	const accountObj = {
	// 		_id: account._id.toString(),
	// 		name: account.name,
	// 		email: account.email,
	// 		orgs: account.orgs,
	// 		currentOrg: account.currentOrg,
	// 		currentTeam: account.currentTeam,
	// 		token: account.token,
	// 		stripeCustomerId: account.stripeCustomerId,
	// 		stripeEndsAt: account.stripeEndsAt,
	// 		stripeCancelled: account.stripeCancelled,
	// 	};
	// 	done(null, accountObj);
	// }

	done(null, null);

}
