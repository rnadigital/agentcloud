import { Strategy as GitHubStrategy } from 'passport-github';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import debug from 'debug';
const log = debug('webapp:oauth');

// GitHub callback handler
export function githubCallback(accessToken, refreshToken, profile, done) {
	// In a real application, you might store profile information in a database
	// For now, we'll just pass the profile to done
	log(`githubCallback profile: ${JSON.stringify(profile, null, '\t')}`);
	done(null, profile);
}

// Google callback handler
export function googleCallback(accessToken, refreshToken, profile, done) {
	// In a real application, you might store profile information in a database
	// For now, we'll just pass the profile to done
	log(`googleCallback profile: ${JSON.stringify(profile, null, '\t')}`);
	done(null, profile);
}

export function serializeHandler(user, done) {
	log(`serializeHandler user: ${JSON.stringify(user, null, '\t')}`);
	done(null, user);
}

export function deserializeHandler(obj, done) {
	log(`deserializeHandler obj: ${JSON.stringify(obj, null, '\t')}`);
	done(null, obj);
}

export type Strategy = {
	strategy: any;
	callback: Function;
	env: string;
	path: string;
}

//To reduce some boilerplace in the router, allows us to just loop and create handlers for each service
export const OAUTH_STRATEGIES: Strategy[] = [
	{ strategy: GitHubStrategy, env: 'GITHUB', callback: githubCallback, path: '/auth/github/callback' },
	{ strategy: GoogleStrategy, env: 'GOOGLE', callback: googleCallback, path: '/auth/google/callback' },
	//TODO: add more here if desired?
];
