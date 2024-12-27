'use strict';

import { Account, getAccountById } from 'db/account';
import { getKeyById } from 'db/apikey';
import { getOrgById, Org } from 'db/org';
import debug from 'debug';
import jwt from 'jsonwebtoken';
const log = debug('webapp:middleware:auth:usejwt');

export type JWTData = {
	accountId: string;
	email: string;
};

export function verifyJwt(token): Promise<JWTData> {
	return new Promise((res, rej) => {
		jwt.verify(token, process.env.JWT_SECRET, async function (err, decoded) {
			if (err != null) {
				res(null);
			} else if (decoded != null) {
				//get version from res if it has version property, get the keyId from the jwt as well, check if the version matches the database object version and reject if they don't
				if (decoded?.version) {
					const key = await getKeyById(decoded?.ownerId, decoded?.keyId);
					if (key?.version === decoded?.version) {
						res(decoded);
					} else {
						res(null);
					}
				} else {
					res(decoded);
				}
			} else {
				//Should never get here, but just in case
				rej(new Error('Error validating login token, please contact support.'));
			}
		});
	});
}

export default async function useJWT(req, res, next): Promise<void> {
	let token;
	if (req?.session?.token) {
		res.locals.checkCsrf = true;
		token = req.session.token;
	} else if (req.headers && req.headers['authorization']?.startsWith('Bearer ')) {
		token = req.headers['authorization'].substring(7);
	}
	if (token && token.length > 0) {
		try {
			const verifiedToken: JWTData = await verifyJwt(token);
			if (verifiedToken != null) {
				const account: Account = await getAccountById(verifiedToken.accountId);
				const org: Org = await getOrgById(account.currentOrg);
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
						permissions: account.permissions,
						onboarded: account.onboarded,
						currentOrgDateCreated: org.dateCreated
					};
					return next();
				}
				req.session.destroy();
			}
		} catch (e) {
			next(e);
		}
	}
	next();
}
