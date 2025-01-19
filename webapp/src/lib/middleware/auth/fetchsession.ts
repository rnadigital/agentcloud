'use strict';

import { Account, getAccountById, getAccountByOAuthOrEmail } from 'db/account';
import { getOrgById, Org } from 'db/org';
import debug from 'debug';
const log = debug('webapp:session');

export default async function fetchSession(req, res, next) {
	// log('req.session:', req.session);
	if (req.session && (req.session.accountId || req.session.passport?.user)) {
		log('req.session.account', req.session.accountId);
		let account: Account;
		let org: Org;
		if (req.session.accountId) {
			account = await getAccountById(req.session.accountId);
			org = await getOrgById(account.currentOrg);
		} else if (req.session.passport?.user) {
			const { oauthId, provider } = req.session.passport?.user;
			account = await getAccountByOAuthOrEmail(oauthId, provider, null);
			org = await getOrgById(account.currentOrg);
		}
		log('account:', account);
		if (account) {
			res.locals.account = {
				_id: account._id.toString(),
				name: account.name,
				email: account.email,
				orgs: account.orgs,
				currentOrg: account.currentOrg,
				currentTeam: account.currentTeam,
				token: account.token,
				stripe: org.stripe,
				oauth: account.oauth,
				permissions: account.permissions
			};
			return next();
		}
		req.session.destroy();
	}
	next();
}
