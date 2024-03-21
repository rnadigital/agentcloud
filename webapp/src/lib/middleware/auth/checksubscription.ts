import { dynamicResponse } from '@dr';
import { getAccountById } from 'db/account';
import { getOrgById } from 'db/org';
import { SubscriptionPlan } from 'struct/billing';

const cache = {};

export function checkSubscriptionPlan(plan: SubscriptionPlan) {
	return cache[plan] || (cache[plan] = async function(req, res, next) {

		let ownerId = res.locals?.matchingOrg?.ownerId;

		if (!ownerId) {
			const currentOrgId = res.locals.matchingOrg.id || res.locals.account.currentOrg;
			if (!currentOrgId) {
				return dynamicResponse(req, res, 400, { error: 'Missing org in subscription check context' });	
			}
			const parentOrg = await getOrgById(currentOrgId);
			if (!parentOrg) {
				return dynamicResponse(req, res, 400, { error: 'Invalid org in subscription check context' });
			}
			const parentOrgOwner = await getAccountById(parentOrg.ownerId);
			if (!parentOrgOwner.stripe || parentOrgOwner.stripe.stripePlan !== plan) {
				return dynamicResponse(req, res, 400, { error: 'Please upgrade to access this feature' });
			}		
		}

		next();

	});
}

export function checkSubscriptionValue() {
	//todo: check a value of a plan limit i.e greater than, less than
}
