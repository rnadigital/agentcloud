'use strict';

import { dynamicResponse } from '@dr';
import { setStripeCustomerId, setStripePlan, updateStripeCustomer } from 'db/account';
import { addCheckoutSession, getCheckoutSessionByAccountId } from 'db/checkoutsession';
import { addPaymentLink, unsafeGetPaymentLinkById } from 'db/paymentlink';
import { addPortalLink } from 'db/portallink';
import debug from 'debug';
import { stripe } from 'lib/stripe';
import toObjectId from 'misc/toobjectid';
import { planToPriceMap, priceToPlanMap, priceToProductMap,SubscriptionPlan } from 'struct/billing';
const log = debug('webapp:stripe');

function destructureSubscription(sub) {
	let planItem, addonUsersItem, addonStorageItem;
	// for (let sub of subscriptionData) {
	if (Array.isArray(sub?.items?.data) && sub.items.data.length > 0) {
		for (let item of sub.items.data) {
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
	// }
	return { planItem, addonUsersItem, addonStorageItem, subscriptionId: sub.id };
} 

async function getSubscriptionsDetails(stripeCustomerId: string) {
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
				stripePlan: planToPriceMap[planItem.price.id],
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
			const { planItem, addonUsersItem, addonStorageItem } = destructureSubscription(subscriptionUpdated);
			//Note: null to not update them unless required
			const update = {
				stripePlan: planToPriceMap[planItem.price.id],
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
			const subscriptionCreated = event.data.object;
			//TODO: check we actually need this
			await updateStripeCustomer(subscriptionCreated.customer, {
				stripeEndsAt: subscriptionCreated.current_period_end,
			});
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

export async function changePlan(req, res, next) {

	if (!process.env['STRIPE_ACCOUNT_SECRET']) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	let stripeCustomerId = res.locals.account?.stripe?.stripeCustomerId;

	if (!stripeCustomerId) {
		return dynamicResponse(req, res, 400, { error: 'Missing Stripe Customer ID - please contact support' });
		/* Note: it shouldn't be impossible to end up here and it definitely shouldn't be possible that they have an existing
		 customer without having it set on their account -- nowhere in this webapp unsets stripe.stripeCustomerId
		const stripeCustomer = await stripe.customers.create({
			email: res.locals.account.email,
			name: res.locals.account.name,
		});
		const subscription = await stripe.subscriptions.create({
			customer: stripeCustomer.id,
			items: [{ price: process.env.STRIPE_FREE_PLAN_PRICE_ID }],
		});
		stripeCustomerId = stripeCustomer.id;
		await setStripeCustomerId(res.locals.account._id, stripeCustomer.id);
		await updateStripeCustomer(stripeCustomer.id, {
			stripePlan: priceToPlanMap[process.env.STRIPE_FREE_PLAN_PRICE_ID],
			stripeEndsAt: subscription.current_period_end*1000,
			stripeTrial: false,
		});
		*/
	}

	const { planItem, addonUsersItem, addonStorageItem, subscriptionId } = await getSubscriptionsDetails(stripeCustomerId);

	if (!subscriptionId) {
		return dynamicResponse(req, res, 400, { error: 'Invalid subscription ID - please contact support' });
	}

	const users = req.body.users || 0;
	const storage = req.body.storage || 0;

	const planItemId = planItem?.id;
	const items: any[] = [
		{
			// price: planToPriceMap[res.locals.account.stripe.stripePlan],
			id: planItemId,
			quantity: 1
		}
	];

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
	
	const subscription = await stripe.subscriptions.update(subscriptionId, {
		items
	});

	return dynamicResponse(req, res, 302, { redirect: '/billing' });
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

