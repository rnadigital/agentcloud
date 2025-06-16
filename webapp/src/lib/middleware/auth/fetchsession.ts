'use strict';

import { Account, getAccountById, getAccountByOAuthOrEmail } from 'db/account';
import { getOrgById, Org } from 'db/org';
import debug from 'debug';
const log = debug('webapp:session');

export default async function fetchSession(req: any, res: any, next: any) {
	if (req.session && (req.session.accountId || req.session.passport?.user)) {
		let account: Account | undefined;
		let org: Org | undefined;

		if (req.session.accountId) {
			account = await getAccountById(req.session.accountId);
			if (account?.currentOrg) {
				org = await getOrgById(account.currentOrg);
			}
		} else if (req.session.passport?.user) {
			const { oauthId, provider } = req.session.passport.user;
			account = await getAccountByOAuthOrEmail(oauthId, provider, null);
			if (account?.currentOrg) {
				org = await getOrgById(account.currentOrg);
			}
		}

		if (account && org) {
			res.locals.account = {
				_id: account._id?.toString(),
				name: account.name,
				email: account.email,
				orgs: account.orgs,
				currentOrg: account.currentOrg,
				currentTeam: account.currentTeam,
				token: account.token,
				stripe: org.stripe,
				oauth: account.oauth,
				permissions: account.permissions,
				currentOrgDateCreated: org.dateCreated
			};
			return next();
		}
		req.session.destroy();
	}
	next();
}
