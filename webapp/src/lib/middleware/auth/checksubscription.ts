import { dynamicResponse } from '@dr';
import { getAccountById } from 'db/account';
import { getOrgById } from 'db/org';
import { getFunctionToolCountByTeam } from 'db/tool';
import debug from 'debug';
import { PlanLimitsKeys, pricingMatrix, SubscriptionPlan } from 'struct/billing';
const log = debug('webapp:middleware:auth:checksubscription');

const cache = {};

//TODO: make this take a PlanLimitsKeys (or an array of) to only calculate certain usages
export async function fetchUsage(req, res, next) {
	const currentOrg = res.locals?.matchingOrg;
	const currentTeam = res.locals?.matchingTeam;

	if (!currentOrg || !currentTeam) {
		return dynamicResponse(req, res, 400, { error: 'Missing org or team in usage check' });
	}

	const { stripePlan } = res.locals?.subscription || {};
	if (!stripePlan) {
		return dynamicResponse(req, res, 400, { error: 'Missing stripe plan in usage check' });
	}

	try {
		const teamMembersCount = Object.keys(currentTeam.permissions).length || 0;
		const functionToolsCount = await getFunctionToolCountByTeam(currentTeam.id);

		// Add usage data to the response locals
		res.locals.usage = {
			...(res.locals.usage || {}),
			[PlanLimitsKeys.users]: teamMembersCount,
			[PlanLimitsKeys.maxFunctionTools]: functionToolsCount
		};

		//TODO: freeze pricingmatrix, switch to structured copy/"deep" copy
		res.locals.limits = JSON.parse(JSON.stringify(pricingMatrix[stripePlan]));

		next();
	} catch (error) {
		log('Error fetching usage:', error);
		return dynamicResponse(req, res, 500, { error: 'Error fetching usage data' });
	}
}

export async function setSubscriptionLocals(req, res, next) {
	const currentOrgId = res.locals?.matchingOrg?.id || res.locals?.account?.currentOrg;
	if (!currentOrgId) {
		// return dynamicResponse(req, res, 400, { error: 'Missing org in subscription check context' });
		return dynamicResponse(req, res, 302, {
			redirect: `/login?goto=${encodeURIComponent(req.originalUrl)}`
		});
	}
	const parentOrg = await getOrgById(currentOrgId);
	if (!parentOrg) {
		return dynamicResponse(req, res, 400, { error: 'Invalid org in subscription check context' });
	}
	const parentOrgOwner = await getAccountById(parentOrg.ownerId);
	if (!parentOrgOwner) {
		return dynamicResponse(req, res, 400, { error: 'Account error' });
	}
	res.locals.subscription = parentOrg.stripe;
	if (res.locals?.account?.stripe) {
		res.locals.account._stripe = res.locals.account.stripe;
		res.locals.account.stripe = parentOrg.stripe; //TODO: think about this some more
	}
	next();
}

export function checkSubscriptionPlan(plans: SubscriptionPlan[]) {
	return (
		// @ts-ignore
		cache[plans] ||
		// @ts-ignore
		(cache[plans] = async function (req, res, next) {
			const { stripePlan } = res.locals?.subscription || {};
			if (!plans.includes(stripePlan)) {
				return dynamicResponse(req, res, 400, {
					error: `This feature is only available on plans: ${plans.join('\n')}`
				});
			}
			next();
		})
	);
}

export function checkSubscriptionLimit(limit: keyof typeof PlanLimitsKeys) {
	// @ts-ignore
	return (
		cache[limit] ||
		(cache[limit] = async function (req, res, next) {
			const { stripePlan, stripeAddons } = res.locals?.subscription || {};
			const usage = res.locals.usage || {};
			const limits = res.locals.limits || {};

			//TODO: move this logic elsewhere
			//TODO: take enterprise subscription metadata fields to set custom limit/addon amounts
			if (limits.users && stripeAddons?.users > 0) {
				limits.users += stripeAddons?.users;
			}
			if (limits.maxVectorStorageSize && stripeAddons?.storage > 0) {
				limits.maxVectorStorageBytes += stripeAddons?.storage * (1024 * 1024 * 1024);
			}

			log(
				'plan: %O, addons: %O, limit: %O, usage: %O, usage[limit]: %O, limits[limit]: %O',
				stripePlan,
				stripeAddons,
				limit,
				usage,
				usage[limit],
				limits[limit]
			);
			// @ts-ignore
			if (!usage || !stripePlan || (usage && stripePlan && usage[limit] >= limits[limit])) {
				return dynamicResponse(req, res, 400, {
					error: `${limit} limit reached (${usage[limit]}/${limits[limit]}).`
				});
			}
			next();
		})
	);
}

export function checkSubscriptionBoolean(limit: keyof typeof PlanLimitsKeys) {
	// @ts-ignore
	return (
		cache[limit] ||
		(cache[limit] = async function (req, res, next) {
			const { stripePlan } = res.locals?.subscription || {};
			const limits = res.locals.limits || {};
			// @ts-ignore
			if (!stripePlan || !limits || limits[limit] !== true) {
				return dynamicResponse(req, res, 400, {
					error: `Plan does not include feature "${limit}".`
				});
			}
			next();
		})
	);
}
