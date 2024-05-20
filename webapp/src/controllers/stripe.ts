'use strict';

import { dynamicResponse } from '@dr';
import { setStripeCustomerId, setStripePlan, updateStripeCustomer } from 'db/account';
import { addCheckoutSession, getCheckoutSessionByAccountId } from 'db/checkoutsession';
import { addPaymentLink, unsafeGetPaymentLinkById } from 'db/paymentlink';
import { addPortalLink } from 'db/portallink';
import debug from 'debug';
import { stripe } from 'lib/stripe';
import { planToPriceMap, priceToPlanMap, priceToProductMap,SubscriptionPlan } from 'struct/billing';
const log = debug('webapp:stripe');
import { io } from '@socketio';
import { addNotification } from 'db/notification';
import toObjectId from 'misc/toobjectid';
import { NotificationType } from 'struct/notification';

function destructureSubscription(sub) {
	let planItem, addonUsersItem, addonStorageItem;
	if (Array.isArray(sub?.items?.data) && sub?.items?.data.length > 0) {
		for (let item of sub?.items?.data) {
			switch (item.price.id) {
				case process.env.STRIPE_FREE_PLAN_PRICE_ID:
				case process.env.STRIPE_PRO_PLAN_PRICE_ID:
				case process.env.STRIPE_TEAMS_PLAN_PRICE_ID:
					planItem = item;
					break;
				case process.env.STRIPE_ADDON_USERS_PRICE_ID:
					addonUsersItem = item;
					break;
				case process.env.STRIPE_ADDON_STORAGE_PRICE_ID:
					addonStorageItem = item;
					break;
			}
		}
	}
	return { planItem, addonUsersItem, addonStorageItem, subscriptionId: sub.id };
} 

export async function getSubscriptionsDetails(stripeCustomerId: string) {
	try {
		const body: any = {
			customer: stripeCustomerId,
			status: 'trialing',
			limit: 1 // fetch only the first subscription
		};
		let subscriptions = await stripe.subscriptions.list(body);
		if (!subscriptions || subscriptions?.data?.length === 0) {
			//They are not on a trial
			body.status = 'active';
			subscriptions = await stripe.subscriptions.list(body);
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

	if (!process.env['STRIPE_WEBHOOK_SECRET']) {
		log('Received stripe webhook but STRIPE_WEBHOOK_SECRET is not set');
		return res.status(400).send('missing STRIPE_WEBHOOK_SECRET');
	}

	const sig = req.headers['stripe-signature'];
	let event;
	try {
		event = stripe.webhooks.constructEvent(req.body, sig, process.env['STRIPE_WEBHOOK_SECRET']);
	} catch (err) {
		log(err);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	log(`Stripe webhook "${event.type}":`, JSON.stringify(event, null, '\t'));

	// Handle the event
	switch (event.type) {

		case 'checkout.session.completed': {
			const checkoutSession = event.data.object;
			const paymentLink = checkoutSession.payment_link;
			if (!paymentLink) {
				log('Completed checkout session without .data.object.payment_link:', checkoutSession);
				break;
			}
			const foundPaymentLink = await unsafeGetPaymentLinkById(paymentLink);
			if (!foundPaymentLink) {
				log('No payment link found for payment link id:', paymentLink);
				break;
			}
			await addCheckoutSession({
				accountId: foundPaymentLink.accountId,
				checkoutSessionId: checkoutSession.id,
				payload: checkoutSession,
				createdDate: new Date(),
			});
			await setStripeCustomerId(foundPaymentLink.accountId, checkoutSession.customer);
			const { planItem, addonUsersItem, addonStorageItem } = await getSubscriptionsDetails(checkoutSession.customer);
			//Note: 0 to set them on else case
			await updateStripeCustomer(checkoutSession.customer, {
				stripePlan: priceToPlanMap[planItem.price.id],
				stripeAddons: {
					users: addonUsersItem ? addonUsersItem.quantity : 0,
					storage: addonStorageItem ? addonStorageItem.quantity : 0,
				},
				stripeEndsAt: checkoutSession?.current_period_end*1000,
			});
			break;
		}

		case 'customer.subscription.updated': {
			const subscriptionUpdated = event.data.object;

			//NOTE: when updating plans, only UPDATED items come through, not the original plan, so we need to get the plan regardless
			// const { planItem, addonUsersItem, addonStorageItem } = destructureSubscription(subscriptionUpdated);

			const { planItem, addonUsersItem, addonStorageItem } = await getSubscriptionsDetails(subscriptionUpdated.customer);
			
			//Note: null to not update them unless required
			const update = {
				...(planItem ? { stripePlan: priceToPlanMap[planItem.price.id] } : {}),
				stripeAddons: {
					users: addonUsersItem ? addonUsersItem.quantity : 0,
					storage: addonStorageItem ? addonStorageItem.quantity : 0,
				},
				stripeEndsAt: subscriptionUpdated?.current_period_end ? subscriptionUpdated?.current_period_end*1000 : null,
				stripeTrial: subscriptionUpdated?.status === 'trialing', // https://docs.stripe.com/api/subscriptions/object#subscription_object-status
			};
			if (subscriptionUpdated['cancel_at_period_end'] === true) {
				log(`${subscriptionUpdated.customer} subscription will cancel at end of period`);
				update['stripeEndsAt'] = subscriptionUpdated.cancel_at;
				update['stripeCancelled'] = true;
			}
			if (subscriptionUpdated['status'] === 'canceled') {
				log(`${subscriptionUpdated.customer} canceled their subscription`);
				update['stripeEndsAt'] = subscriptionUpdated.cancel_at;
				update['stripeCancelled'] = true;
			}
			log('Customer subscription update %O', update);
			await updateStripeCustomer(subscriptionUpdated.customer, update);
			break;
		}

		case 'customer.subscription.created': {
			// const subscriptionCreated = event.data.object;
			// await updateStripeCustomer(subscriptionCreated.customer, {
			// 	stripeEndsAt: subscriptionCreated.current_period_end*1000,
			// });
			break;
		}
		
		// case 'customer.subscription.trial_will_end': {
		// 	break;
		// }
		
		//TODO:
		// case 'customer.subscription.deleted': {
		// 	break;
		// }

		default: {
			log(`Unhandled stripe webhook event type "${event.type}"`);
		}
	}

	// Return a 200 response to acknowledge receipt of the event
	res.status(200).send();

}

export async function hasPaymentMethod(req, res, next) {

	let stripeCustomerId = res.locals.account?.stripe?.stripeCustomerId;

	if (!stripeCustomerId) {
		return dynamicResponse(req, res, 400, { error: 'Missing Stripe Customer ID - please contact support' });
	}

	const paymentMethods = await stripe.customers.listPaymentMethods(stripeCustomerId, {
		limit: 3, //Just 1??
	});

	const hasPaymentMethods = paymentMethods?.data?.length > 0;
	const last4 = hasPaymentMethods ? paymentMethods.data[0].card.last4 : null;

	return dynamicResponse(req, res, 200, { ok: hasPaymentMethods, last4 });

}

export async function requestChangePlan(req, res, next) {

	if (!process.env['STRIPE_ACCOUNT_SECRET']) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	let stripeCustomerId = res.locals.account?.stripe?.stripeCustomerId;

	if (!stripeCustomerId) {
		return dynamicResponse(req, res, 400, { error: 'Missing Stripe Customer ID - please contact support' });
	}

	const { planItem, addonUsersItem, addonStorageItem, subscriptionId } = await getSubscriptionsDetails(stripeCustomerId);

	if (!subscriptionId) {
		return dynamicResponse(req, res, 400, { error: 'Invalid subscription ID - please contact support' });
	}

	const users = req.body.users || 0;
	const storage = req.body.storage || 0;
	const plan = req.body.plan;
	const planPrice = planToPriceMap[plan];

	if (![process.env.STRIPE_FREE_PLAN_PRICE_ID,
		process.env.STRIPE_PRO_PLAN_PRICE_ID,
		process.env.STRIPE_TEAMS_PLAN_PRICE_ID].includes(planPrice)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid plan selection' });
	}

	const planItemId = planItem?.id;
	const items: any[] = [
		{
			price: planPrice,
			quantity: 1
		}
	];

	//Note: Stripe needs the subscription item id if it's an existing subscription item else it needs the price id
	const usersItemId = addonUsersItem?.id;
	items.push({
		price: process.env.STRIPE_ADDON_USERS_PRICE_ID,
		quantity: users,
	});
	
	const storageItemId = addonStorageItem?.id;
	items.push({
		price: process.env.STRIPE_ADDON_STORAGE_PRICE_ID,
		quantity: storage,
	});

	const createdCheckoutSession = await stripe.checkout.sessions.create({
		customer: stripeCustomerId,
		success_url: `${process.env.URL_APP}/auth/redirect?to=${encodeURIComponent('/billing')}`,
		line_items: items.filter(i => i.quantity > 0),
		currency: 'USD',
		mode: 'subscription',
	});
	const checkoutSession = await stripe.checkout.sessions.retrieve(createdCheckoutSession.id, {
		expand: ['line_items'], //Note: necessary because .create() does not return non-expanded fields
	});
	console.log(JSON.stringify(checkoutSession, null, 2));

	return dynamicResponse(req, res, 302, {
		checkoutSession: {
			id: checkoutSession.id, //for useEffect
			line_items: checkoutSession.line_items,
			amount_total: checkoutSession.amount_total,
			plan, users, storage,
		}
	});
}

export async function confirmChangePlan(req, res, next) {

	if (!process.env['STRIPE_ACCOUNT_SECRET']) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	let stripeCustomerId = res.locals.account?.stripe?.stripeCustomerId;

	if (!stripeCustomerId) {
		return dynamicResponse(req, res, 400, { error: 'Missing Stripe Customer ID - please contact support' });
	}

	const { planItem, addonUsersItem, addonStorageItem, subscriptionId } = await getSubscriptionsDetails(stripeCustomerId);

	if (!subscriptionId) {
		return dynamicResponse(req, res, 400, { error: 'Invalid subscription ID - please contact support' });
	}

	const plan = req.body.plan;
	const planPrice = planToPriceMap[plan];
	if (![process.env.STRIPE_FREE_PLAN_PRICE_ID,
		process.env.STRIPE_PRO_PLAN_PRICE_ID,
		process.env.STRIPE_TEAMS_PLAN_PRICE_ID].includes(planPrice)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid plan selection' });
	}
	
	const users = req.body.users || 0;
	const storage = req.body.storage || 0;
	const planItemId = planItem?.id;
	const items: any[] = [
		{
			...(planItem?.price?.id === planToPriceMap[req.body.plan] ? { id: planItemId } : { price: planToPriceMap[req.body.plan] }),
			quantity: 1
		}
	];
	if (planItemId && planItem?.price?.id !== planToPriceMap[req.body.plan]) {
		/* Ensure we delete the old plan (if different id from current) to not have 2 "plans" in the subscription
		because setting quantity to 0  on the old plan doesn't remove it from the subscription */
		const deleted = await stripe.subscriptionItems.del(planItemId);
	}

	//Note: Stripe needs the subscription item id if it's an existing subscription item else it needs the price id
	const usersItemId = addonUsersItem?.id;
	items.push({
		...(usersItemId ? { id: usersItemId } : { price: process.env.STRIPE_ADDON_USERS_PRICE_ID }),
		quantity: users,
	});
	
	const storageItemId = addonStorageItem?.id;
	items.push({
		...(storageItemId ? { id: storageItemId } : { price: process.env.STRIPE_ADDON_STORAGE_PRICE_ID }),
		quantity: storage,
	});

	const paymentMethods = await stripe.customers.listPaymentMethods(stripeCustomerId, {
		limit: 3
	});

	if (!Array.isArray(paymentMethods?.data) || paymentMethods.data.length === 0) {
		const checkoutSession = await stripe.checkout.sessions.create({
			ui_mode: 'embedded',
			customer: stripeCustomerId,
			redirect_on_completion: 'never',
			currency: 'USD',
			mode: 'setup',
		});
		return dynamicResponse(req, res, 302, { clientSecret: checkoutSession.client_secret });
	}

	const subscription = await stripe.subscriptions.update(subscriptionId, {
		items
	});

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
	
	return dynamicResponse(req, res, 200, { });
}

export async function createPortalLink(req, res, next) {

	if (!process.env['STRIPE_ACCOUNT_SECRET']) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	const customerId = res.locals.account?.stripe?.stripeCustomerId;

	if (!customerId) {
		return dynamicResponse(req, res, 400, { error: 'Missing Stripe Customer ID - please contact support' });
	}

	const portalLink = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${process.env.URL_APP}/auth/redirect?to=${encodeURIComponent('/billing')}`,
	});

	await addPortalLink({
		accountId: toObjectId(res.locals.account._id),
		portalLinkId: portalLink.id,
		url: portalLink.url,
		payload: portalLink,
		createdDate: new Date(),
	});

	return dynamicResponse(req, res, 302, { redirect: portalLink.url });
}

