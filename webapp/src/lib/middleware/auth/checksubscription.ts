import { dynamicResponse } from '@dr';
import { getAccountById } from 'db/account';
import { getOrgById } from 'db/org';
import { PlanLimits, SubscriptionPlan } from 'struct/billing';

const cache = {};

export async function setSubscriptionLocals(req, res, next) {

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
		if (!parentOrgOwner) {
			return dynamicResponse(req, res, 400, { error: 'Account error' });
		}
		res.locals.subscription = parentOrgOwner.stripe;
	}

	next();

}

export function checkSubscriptionPlan(plan: SubscriptionPlan) {
	return cache[plan] || (cache[plan] = async function(req, res, next) {

		const { stripePlan } = (res.locals?.subscription || {});
		
		if (!stripePlan || stripePlan !== plan) {
			return dynamicResponse(req, res, 400, { error: 'Please upgrade to access this feature' });
		}

		next();

	});
}

export function checkSubscriptionLimit(limit: keyof PlanLimits) {
	return cache[limit] || (cache[limit] = async function(req, res, next) {
		const usage = res.locals.usage;
		if (usage && usage[limit] > res.locals.subscription[limit]) {
			return dynamicResponse(req, res, 400, { error: `Limit for ${limit} exceeded. Please upgrade your plan.` });
		}
		next();
	});
}

export function checkSubscriptionValue() {
	//todo: check a value of a plan limit i.e greater than, less than
}
