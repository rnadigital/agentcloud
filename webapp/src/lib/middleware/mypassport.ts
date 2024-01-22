import passport from 'passport';
import { OAuthStrategy } from 'struct/oauth';

import * as oauthController from '../../controllers/oauth';

// Passport session setup
passport.serializeUser(oauthController.serializeHandler);
passport.deserializeUser(oauthController.deserializeHandler);

// Setup all the oauth handlers
oauthController.OAUTH_STRATEGIES.forEach((s: OAuthStrategy) => {
	if (!process.env[`OAUTH_${s.env}_CLIENT_ID`]) { return; }
	passport.use(new s.strategy({
		clientID: process.env[`OAUTH_${s.env}_CLIENT_ID`],
		clientSecret: process.env[`OAUTH_${s.env}_CLIENT_SECRET`],
		callbackURL: `${process.env.URL_APP}${s.path}`,
		...s.extra,
	}, s.callback));
});

export default passport;
