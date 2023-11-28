'use strict';

import { getAccountById, Account, getAccountByOAuth } from '../../../db/account';
import debug from 'debug';
const log = debug('webapp:session');

export default async function fetchSession(req, res, next) {
	// log('req.session:', req.session);
	if (req.session) {
		let account: Account;
		if (req.session.accountId) {
			account = await getAccountById(req.session.accountId);
		} else if (req.session.passport?.user) {
			const { oauthId, provider } = req.session.passport?.user;
			account = await getAccountByOAuth(oauthId, provider);
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
				stripeCustomerId: account.stripeCustomerId,
				stripeEndsAt: account.stripeEndsAt,
				stripeCancelled: account.stripeCancelled,
				oauth: account.oauth,
			};
			return next();
		}
		req.session.destroy();
	}
	next();
}
