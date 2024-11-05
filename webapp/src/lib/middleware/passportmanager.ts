import debug from 'debug';
import passport from 'passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import { OAuthStrategy } from 'struct/oauth';

import * as oauthController from '../../controllers/oauth';
const log = debug('webapp:middleware:passportmanager');

class PassportManager {
	private static instance: PassportManager;
	private initialized = false;

	private constructor() {}

	public static getInstance(): PassportManager {
		if (!PassportManager.instance) {
			PassportManager.instance = new PassportManager();
		}
		return PassportManager.instance;
	}

	public async init() {
		if (this.initialized) {
			return;
		}
		log('Initializing passport manager');
		this.initialized = true;

		// Passport session setup
		passport.serializeUser(oauthController.serializeHandler);
		passport.deserializeUser(oauthController.deserializeHandler);

		// Setup all the oauth handlers
		await Promise.all(
			oauthController.OAUTH_STRATEGIES.map(async (s: OAuthStrategy) => {
				const secretProvider = SecretProviderFactory.getSecretProvider();
				const clientID = await secretProvider.getSecret(SecretKeys[s.secretKeys.clientId]);
				const clientSecret = await secretProvider.getSecret(SecretKeys[s.secretKeys.secret]);
				log('Setting up oauth authentication strategy for %s with clientID %s', s.path, clientID);
				if (!clientID || !clientSecret) {
					log('Missing clientID or clientSecret for strategy %s', s.path);
					return;
				}
				passport.use(
					new s.strategy(
						{
							clientID,
							clientSecret,
							callbackURL: `${process.env.URL_APP}${s.path}`,
							...s.extra
						},
						s.callback
					)
				);
				log('Successfully setup oauth authentication strategy for %s', s.path);
			})
		);
		//airtable uses a custom connector so initialize it here
		log('Setting up custom strategies');
		passport.use(
			'airtable',
			new CustomStrategy(async (req, done) => {
				try {
					const code = typeof req.query.code === 'string' ? req.query.code : null;
					if (!code) {
						return done({ message: 'Authorization code not provided or invalid' }, null);
					}
					//Exchange auth code for access token
					const tokenResponse = await fetch('https://airtable.com/oauth2/v1/token', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						body: new URLSearchParams({
							client_id: process.env.OAUTH_AIRTABLE_CLIENT_ID,
							client_secret: process.env.OAUTH_AIRTABLE_CLIENT_SECRET,
							code,
							grant_type: 'authorization_code',
							redirect_uri: 'http://localhost:3000/airtable/callback'
						})
					});

					if (!tokenResponse.ok) {
						throw new Error('Failed to retrieve tokens');
					}

					const { access_token, refresh_token, expires_in } = await tokenResponse.json();

					//retrieve user information from Airtable api using the creds we just got
					const userResponse = await fetch('https://airtable.com/v0/meta/whoami', {
						headers: {
							authorization: `Bearer ${access_token}`
						}
					});

					if (!userResponse.ok) {
						throw new Error('Failed to get user information');
					}

					const user = await userResponse.json();

					//attach auth tokens to user object and return
					user.accessToken = access_token;
					user.refreshToken = refresh_token;
					user.tokenExpiresIn = expires_in;

					return done(null, user);
				} catch (error) {
					return done(error);
				}
			})
		);

		log('Passport manager initialized successfully');
	}

	public getPassport() {
		return passport;
	}
}

export default PassportManager.getInstance();
