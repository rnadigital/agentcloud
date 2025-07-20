'use strict';

import { dynamicResponse } from '@dr';
import {
	getOrgById,
	getOrgByStripeCustomerId,
	setOrgStripeCustomerId,
	updateOrgStripeCustomer
} from 'db/org';
import { addPortalLink } from 'db/portallink';
import debug from 'debug';
import StripeClient from 'lib/stripe';
import {
	planToPriceMap,
	productToPlanMap,
	stripeEnvs,
	SubscriptionPlan,
	SubscriptionPlanConfig,
	subscriptionPlans
} from 'struct/billing';
const log = debug('webapp:stripe');
import toObjectId from 'misc/toobjectid';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import { chainValidations } from 'utils/validationutils';

function destructureSubscription(sub) {
	let planItem, addonUsersItem, addonStorageItem;
	if (Array.isArray(sub?.items?.data) && sub?.items?.data.length > 0) {
		for (let item of sub?.items?.data) {
			switch (item.plan.product) {
				case process.env.STRIPE_FREE_PLAN_PRODUCT_ID:
				case process.env.STRIPE_PRO_PLAN_PRODUCT_ID:
				case process.env.STRIPE_TEAMS_PLAN_PRODUCT_ID:
				case process.env.STRIPE_ENTERPRISE_PLAN_PRODUCT_ID:
					planItem = item;
					break;
				case process.env.STRIPE_ADDON_USERS_PRODUCT_ID:
					addonUsersItem = item;
					break;
				case process.env.STRIPE_ADDON_STORAGE_PRODUCT_ID:
					addonStorageItem = item;
					break;
			}
		}
	}
	return { planItem, addonUsersItem, addonStorageItem, subscriptionId: sub?.id };
}

export async function getSubscriptionsDetails(stripeCustomerId: string) {
	try {
		const body: any = {
			customer: stripeCustomerId,
			status: 'trialing',
			limit: 1 // fetch only the first subscription
		};
		let subscriptions = await StripeClient.get().subscriptions.list(body);
		if (!subscriptions || subscriptions?.data?.length === 0) {
			//They are not on a trial
			body.status = 'active';
			subscriptions = await StripeClient.get().subscriptions.list(body);
		}
		return destructureSubscription(subscriptions.data[0]);
	} catch (error) {
		console.error('Error fetching subscriptions:', error);
		throw error;
	}
}

/**
 * @api {post} /stripe-webhook
 */
export async function webhookHandler(req, res, next) {
	const secretProvider = SecretProviderFactory.getSecretProvider();
	const STRIPE_WEBHOOK_SECRET = await secretProvider.getSecret(SecretKeys.STRIPE_WEBHOOK_SECRET);

	if (!STRIPE_WEBHOOK_SECRET) {
		log('missing STRIPE_WEBHOOK_SECRET');
		return res.status(400).send('missing STRIPE_WEBHOOK_SECRET');
	}

	const sig = req.headers['stripe-signature'];
	let event;
	try {
		event = StripeClient.get().webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		log(err);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	log(`Stripe webhook "${event.type}":`, JSON.stringify(event, null, '\t'));

	// Handle the event
	switch (event.type) {
		case 'setup_intent.succeeded': {
			const checkoutSession = event.data.object;
			const stripeCustomerId = checkoutSession?.customer;
			const newPaymentMethodId = checkoutSession?.payment_method;
			// Set the customer's default payment method
			await StripeClient.get().customers.update(stripeCustomerId, {
				invoice_settings: {
					default_payment_method: newPaymentMethodId
				}
			});
			break;
		}

		case 'customer.subscription.created':
		case 'customer.subscription.updated': {
			const subscriptionUpdated = event.data.object;

			const { planItem, addonUsersItem, addonStorageItem } = await getSubscriptionsDetails(
				subscriptionUpdated.customer
			);

			log('Customer subscription update planItem %O', planItem);
			//Note: null to not update them unless required
			const update = {
				...(planItem
					? { stripePlan: productToPlanMap[planItem.price.product] }
					: { stripePlan: SubscriptionPlan.FREE }),
				stripeAddons: {
					users: addonUsersItem ? addonUsersItem.quantity : 0,
					storage: addonStorageItem ? addonStorageItem.quantity : 0
				},
				stripeEndsAt: subscriptionUpdated?.current_period_end
					? subscriptionUpdated?.current_period_end * 1000
					: null,
				stripeTrial: subscriptionUpdated?.status === 'trialing'
			};
			log('Customer subscription update 1 %O', update);
			if (subscriptionUpdated['status'] === 'canceled') {
				log(`${subscriptionUpdated.customer} canceled their subscription`);
				update['stripeEndsAt'] = subscriptionUpdated.cancel_at * 1000;
				update['stripeCancelled'] = true;
			} else if (subscriptionUpdated['cancel_at_period_end'] === true) {
				log(`${subscriptionUpdated.customer} subscription will cancel at end of period`);
				update['stripeEndsAt'] = subscriptionUpdated.cancel_at * 1000;
				update['stripeCancelled'] = true;
			} else {
				update['stripeEndsAt'] = subscriptionUpdated.current_period_end * 1000;
				update['stripeCancelled'] = false;
			}
			if (Date.now() >= update['stripeEndsAt'] && update['stripeCancelled'] === true) {
				update['stripePlan'] = SubscriptionPlan.FREE;
			}
			log('Customer subscription update 2 %O', update);

			// Get org by stripe customer ID
			const org = await getOrgByStripeCustomerId(subscriptionUpdated.customer);
			if (!org) {
				log('No org found for stripe customer ID:', subscriptionUpdated.customer);
				return;
			}
			await updateOrgStripeCustomer(org._id, update);
			break;
		}

		case 'customer.subscription.deleted': {
			const subscriptionDeleted = event.data.object;
			const org = await getOrgByStripeCustomerId(subscriptionDeleted.customer);
			if (!org) {
				log('No org found for stripe customer ID:', subscriptionDeleted.customer);
				return;
			}
			await updateOrgStripeCustomer(org._id, {
				stripePlan: SubscriptionPlan.FREE,
				stripeAddons: { users: 0, storage: 0 },
				stripeCancelled: true,
				stripeTrial: false
			});
			break;
		}

		case 'customer.subscription.paused': {
			const subscriptionPaused = event.data.object;
			const org = await getOrgByStripeCustomerId(subscriptionPaused.customer);
			if (!org) {
				log('No org found for stripe customer ID:', subscriptionPaused.customer);
				return;
			}
			await updateOrgStripeCustomer(org._id, {
				stripePlan: SubscriptionPlan.FREE,
				stripeAddons: { users: 0, storage: 0 },
				stripeCancelled: true,
				stripeTrial: false
			});
			break;
		}

		default: {
			log(`Unhandled stripe webhook event type "${event.type}"`);
		}
	}

	// Return a 200 response to acknowledge receipt of the event
	res.status(200).send();
}

export async function hasPaymentMethod(req, res, next) {
	const stripeCustomerId = res.locals.account.stripe?.stripeCustomerId;
	if (!stripeCustomerId) {
		return dynamicResponse(req, res, 400, {
			error: 'Organization not configured with Stripe - please contact support'
		});
	}

	const paymentMethods = await StripeClient.get().customers.listPaymentMethods(stripeCustomerId, {
		limit: 1
	});

	const hasPaymentMethods = paymentMethods?.data?.length > 0;
	const last4 = hasPaymentMethods ? paymentMethods.data[0].card.last4 : null;

	return dynamicResponse(req, res, 200, { ok: hasPaymentMethods, last4 });
}

export async function requestChangePlan(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'plan',
				validation: { notEmpty: true, inSet: new Set(Object.values(SubscriptionPlan)) }
			}
		],
		{ plan: 'Plan' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const secretProvider = SecretProviderFactory.getSecretProvider();
	const STRIPE_WEBHOOK_SECRET = await secretProvider.getSecret(SecretKeys.STRIPE_WEBHOOK_SECRET);

	if (!STRIPE_WEBHOOK_SECRET) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	const stripeCustomerId = res.locals.account.stripe?.stripeCustomerId;

	if (!stripeCustomerId) {
		return dynamicResponse(req, res, 400, {
			error: 'Organization not configured with Stripe - please contact support'
		});
	}

	const { planItem, addonUsersItem, addonStorageItem, subscriptionId } =
		await getSubscriptionsDetails(stripeCustomerId);

	// if (!subscriptionId) {
	// 	return dynamicResponse(req, res, 400, { error: 'Invalid subscription ID - please contact support' });
	// }

	const users = req.body.users || 0;
	const storage = req.body.storage || 0;
	const plan = req.body.plan;
	const planPriceId = planToPriceMap[plan];

	if (
		![
			process.env.STRIPE_FREE_PLAN_PRICE_ID,
			process.env.STRIPE_PRO_PLAN_PRICE_ID,
			process.env.STRIPE_TEAMS_PLAN_PRICE_ID
		].includes(planPriceId)
	) {
		return dynamicResponse(req, res, 400, { error: 'Invalid plan selection' });
	}

	const planItemId = planItem?.id;
	const items: any[] = [
		{
			price: planPriceId,
			quantity: 1
		}
	];

	//Note: Stripe needs the subscription item id if it's an existing subscription item else it needs the price id
	const usersItemId = addonUsersItem?.id;
	items.push({
		price: process.env.STRIPE_ADDON_USERS_PRICE_ID,
		quantity: users
	});

	const storageItemId = addonStorageItem?.id;
	items.push({
		price: process.env.STRIPE_ADDON_STORAGE_PRICE_ID,
		quantity: storage
	});

	const createdCheckoutSession = await StripeClient.get().checkout.sessions.create({
		customer: stripeCustomerId,
		success_url: `${process.env.URL_APP}/auth/redirect?to=${encodeURIComponent('/billing')}`,
		line_items: items.filter(i => i.quantity > 0),
		currency: 'USD',
		mode: 'subscription'
	});

	const checkoutSession = await StripeClient.get().checkout.sessions.retrieve(
		createdCheckoutSession.id,
		{
			expand: ['line_items'] //Note: necessary because .create() does not return non-expanded fields
		}
	);

	return dynamicResponse(req, res, 302, {
		checkoutSession: {
			id: checkoutSession.id, //for useEffect
			line_items: checkoutSession.line_items,
			amount_total: checkoutSession.amount_total,
			plan,
			users,
			storage
		}
	});
}

export async function confirmChangePlan(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[
			{
				field: 'plan',
				validation: { notEmpty: true, inSet: new Set(Object.values(SubscriptionPlan)) }
			}
		],
		{ plan: 'Plan' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const secretProvider = SecretProviderFactory.getSecretProvider();
	const STRIPE_ACCOUNT_SECRET = await secretProvider.getSecret(SecretKeys.STRIPE_ACCOUNT_SECRET);

	if (!STRIPE_ACCOUNT_SECRET) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	let { stripeTrial, stripePlan, stripeCustomerId } = res.locals.account?.stripe || {};

	if (!stripeCustomerId) {
		return dynamicResponse(req, res, 400, {
			error: 'Missing Stripe Customer ID - please contact support'
		});
	}

	const { planItem, addonUsersItem, addonStorageItem, subscriptionId } =
		await getSubscriptionsDetails(stripeCustomerId);

	// if (!subscriptionId) {
	// 	return dynamicResponse(req, res, 400, { error: 'Invalid subscription ID - please contact support' });
	// }

	const plan = req.body.plan;
	const planPriceId = planToPriceMap[plan];
	if (
		![
			process.env.STRIPE_FREE_PLAN_PRICE_ID,
			process.env.STRIPE_PRO_PLAN_PRICE_ID,
			process.env.STRIPE_TEAMS_PLAN_PRICE_ID
		].includes(planPriceId)
	) {
		return dynamicResponse(req, res, 400, { error: 'Invalid plan selection' });
	}

	const users = req.body.users || 0;
	const storage = req.body.storage || 0;
	const planItemId = planItem?.id;
	const items: any[] = [
		{
			//TODO: check might be redundant now
			...(planItem?.price?.id === planToPriceMap[req.body.plan]
				? { id: planItemId }
				: { price: planToPriceMap[req.body.plan] }),
			quantity: 1
		}
	];

	if (planItemId && planItem?.price?.id !== planToPriceMap[req.body.plan]) {
		items.push({
			id: planItemId,
			deleted: true
		});
	}

	//Note: Stripe needs the subscription item id if it's an existing subscription item else it needs the price id
	const usersItemId = addonUsersItem?.id;
	items.push({
		...(usersItemId ? { id: usersItemId } : { price: process.env.STRIPE_ADDON_USERS_PRICE_ID }),
		quantity: users
	});

	const storageItemId = addonStorageItem?.id;
	items.push({
		...(storageItemId
			? { id: storageItemId }
			: { price: process.env.STRIPE_ADDON_STORAGE_PRICE_ID }),
		quantity: storage
	});

	const paymentMethods = await StripeClient.get().customers.listPaymentMethods(stripeCustomerId, {
		limit: 1
	});

	const foundPlan: SubscriptionPlanConfig = subscriptionPlans.find(plan => {
		return plan.priceId === planPriceId;
	});
	if (!foundPlan) {
		return dynamicResponse(req, res, 400, { error: 'Could not find plan in pricing table' });
	}

	if (
		(!Array.isArray(paymentMethods?.data) || paymentMethods.data.length === 0) &&
		foundPlan.price > 0
	) {
		const checkoutSession = await StripeClient.get().checkout.sessions.create({
			ui_mode: 'embedded',
			customer: stripeCustomerId,
			redirect_on_completion: 'never',
			currency: 'USD',
			mode: 'setup'
		});
		return dynamicResponse(req, res, 302, { clientSecret: checkoutSession.client_secret });
	}

	if (subscriptionId) {
		await StripeClient.get().subscriptions.update(subscriptionId, {
			items,
			...(stripeTrial === true ? { trial_end: 'now' } : {})
		});
	} else {
		await StripeClient.get().subscriptions.create({
			customer: stripeCustomerId,
			items
		});
	}

	// const notification = {
	//     orgId: toObjectId(res.locals.matchingOrg.id.toString()),
	//     teamId: toObjectId(res.locals.matchingTeam.id.toString()),
	//     target: {
	// 	    //what to do for subscriptions?
	// 		id: null,
	// 		collection: null,
	// 		property: null,
	// 		objectId: null,
	//     },
	//     title: 'Subscription updated',
	//     date: new Date(),
	//     seen: false,
	// 	// stuff specific to notification type
	//     description: 'Your subscription was updated successfully.',
	// 	type: NotificationType.UserAction,
	// 	details: null,
	// };
	// await addNotification(notification);
	// io.to(res.locals.matchingTeam.id).emit('notification', notification);

	return dynamicResponse(req, res, 200, {});
}

export async function createPortalLink(req, res, next) {
	const secretProvider = SecretProviderFactory.getSecretProvider();
	const STRIPE_ACCOUNT_SECRET = await secretProvider.getSecret(SecretKeys.STRIPE_ACCOUNT_SECRET);

	if (!STRIPE_ACCOUNT_SECRET) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	const customerId = res.locals.account?.stripe?.stripeCustomerId;

	if (!customerId) {
		return dynamicResponse(req, res, 400, {
			error: 'Missing Stripe Customer ID - please contact support'
		});
	}

	const portalLink = await StripeClient.get().billingPortal.sessions.create({
		customer: customerId,
		return_url: `${process.env.URL_APP}/auth/redirect?to=${encodeURIComponent('/billing')}`
	});

	await addPortalLink({
		accountId: toObjectId(res.locals.account._id),
		portalLinkId: portalLink.id,
		url: portalLink.url,
		payload: portalLink,
		createdDate: new Date()
	});

	return dynamicResponse(req, res, 302, { redirect: portalLink.url });
}

export async function checkReady(req, res, next) {
	const secretProvider = SecretProviderFactory.getSecretProvider();
	const missingEnvs = [];

	await Promise.all(
		stripeEnvs.map(async k => {
			if (process.env[k] == null && (await secretProvider.getSecret(k)) == null) {
				missingEnvs.push(k);
			}
		})
	);

	return dynamicResponse(req, res, 200, { missingEnvs });
}
