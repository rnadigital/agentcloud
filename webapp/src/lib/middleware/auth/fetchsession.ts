'use strict';

import { Account, getAccountById, getAccountByOAuthOrEmail } from 'db/account';
import debug from 'debug';
const log = debug('webapp:session');

export default async function fetchSession(req, res, next) {
	log('req.session.passport?.user:', req.session.passport?.user);
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
				log('found refreshToken: ', req.session.passport?.user?.refreshToken);
				const provider = req.session.passport?.user?.provider;
				const refreshToken = req.session.passport?.user?.refreshToken;
				res.locals.datasourceOAuth = {
					provider,
					refreshToken
				};
			}
			return next();
		}
		req.session.destroy();
	}
	next();
}
