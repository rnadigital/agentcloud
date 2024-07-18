import passport from 'passport';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import { OAuthStrategy } from 'struct/oauth';

import * as oauthController from '../../controllers/oauth';

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
		this.initialized = true;

		// Passport session setup
		passport.serializeUser(oauthController.serializeHandler);
		passport.deserializeUser(oauthController.deserializeHandler);

		// Setup all the oauth handlers
		await Promise.all(oauthController.OAUTH_STRATEGIES.map(async (s: OAuthStrategy) => {
			const secretProvider = SecretProviderFactory.getSecretProvider();
			const clientID = await secretProvider.getSecret(SecretKeys[s.secretKeys.clientId]);
			const clientSecret = await secretProvider.getSecret(SecretKeys[s.secretKeys.secret]);
			if (!clientID || !clientSecret) { return; }
			passport.use(new s.strategy({
				clientID,
				clientSecret,
				callbackURL: `${process.env.URL_APP}${s.path}`,
				...s.extra,
			}, s.callback));
		}));
	}

	public getPassport() {
		return passport;
	}
}

export default PassportManager.getInstance();
