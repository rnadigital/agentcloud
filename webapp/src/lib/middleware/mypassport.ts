import passport from 'passport';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import { OAuthStrategy } from 'struct/oauth';

import * as oauthController from '../../controllers/oauth';

// Passport session setup
passport.serializeUser(oauthController.serializeHandler);
passport.deserializeUser(oauthController.deserializeHandler);

// Setup all the oauth handlers
oauthController.OAUTH_STRATEGIES.forEach(async (s: OAuthStrategy) => {
	const secretProvider = SecretProviderFactory.getSecretProvider();
	const clientID = await secretProvider.getSecret(SecretKeys[s.secretKeys.clientId]);
	const clientSecret = await secretProvider.getSecret(SecretKeys[s.secretKeys.secret]);
	if (!clientID || clientSecret) { return; }
	passport.use(new s.strategy({
		clientID,
		clientSecret,
		callbackURL: `${process.env.URL_APP}${s.path}`,
		...s.extra,
	}, s.callback));
});

export default passport;
