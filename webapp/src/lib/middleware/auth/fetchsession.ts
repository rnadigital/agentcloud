'use strict';

import { Account, getAccountById, getAccountByOAuthOrEmail } from 'db/account';
import debug from 'debug';
const log = debug('webapp:session');

export default async function fetchSession(req, res, next) {
	// log('req.session.passport?.user:', req.session.passport?.user);
	// Proceed with the rest of fetchSession logic
	if (req.session && (req.session.accountId || req.session.passport?.user)) {
		let account: Account;
		if (req.session.accountId) {
			account = await getAccountById(req.session.accountId);
		} else if (req.session.passport?.user) {
			const { oauthId, provider } = req.session.passport?.user;
			account = await getAccountByOAuthOrEmail(oauthId, provider, null);
		}
		// log('account:', account);
		if (account) {
			res.locals.account = {
				_id: account._id.toString(),
				name: account.name,
				email: account.email,
				orgs: account.orgs,
				currentOrg: account.currentOrg,
				currentTeam: account.currentTeam,
				token: account.token,
				stripe: account.stripe,
				oauth: account.oauth,
				permissions: account.permissions
			};
			if (req.session.passport?.user?.refreshToken) {
				// log('found refreshToken: ', req.session.passport?.user?.refreshToken);
				let provider = req.session.passport?.user?.provider;
				if(provider === 'forcedotcom'){ //the passport strategy used for salesforce is forcedotcom, this is owned by salesforce but goes under a different name, so if we get 'forcedotcom' we actually mean 'salesforce'
					provider = 'salesforce'
				}
				const refreshToken = req.session.passport?.user?.refreshToken;
				res.locals.datasourceOAuth = {
					provider,
					refreshToken
				};
			}

			// Retrieve and store oauthData in res.locals if it exists in session
			if (req.session.oauthData) {
				const { datasourceName, datasourceDescription } = req.session.oauthData;
				res.locals.oauthData = { datasourceName, datasourceDescription };
				log('Retrieved oauthData from session:', res.locals.oauthData);
			}

			return next();
		}
		req.session.destroy();
	}
	next();
}
