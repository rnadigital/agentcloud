'use strict';

import { getAccountById, Account } from '../../../db/account';

export default async function fetchSession(req, res, next) {
	if (req.session && req.session.accountId) {
		const account: Account = await getAccountById(req.session.accountId);
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
			};
			return next();
		}
		req.session.destroy();
	}
	next();
}
