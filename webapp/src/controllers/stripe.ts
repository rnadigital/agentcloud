'use strict';

import { dynamicResponse } from '@dr';
import { setStripeCustomerId, setStripePlan, updateStripeCustomer } from 'db/account';
import { addCheckoutSession, getCheckoutSessionByAccountId } from 'db/checkoutsession';
import { addPaymentLink, unsafeGetPaymentLinkById } from 'db/paymentlink';
import { addPortalLink } from 'db/portallink';
import debug from 'debug';
import { stripe } from 'lib/stripe';
import toObjectId from 'misc/toobjectid';
import { planToPriceMap, priceToPlanMap, SubscriptionPlan } from 'struct/billing';
const log = debug('webapp:stripe');

function destructureSubscription(sub) {
	let planSub
		, addonUsersSub
		, addonStorageSub;
	// for (let sub of subscriptionData) {
	if (Array.isArray(sub?.items?.data) && sub.items.data[0]?.price?.id) {
		switch (sub.items.data[0]?.price?.id) {
			case process.env.STRIPE_FREE_PLAN_PRICE_ID:
			case process.env.STRIPE_PRO_PLAN_PRICE_ID:
			case process.env.STRIPE_TEAMS_PLAN_PRICE_ID:
				planSub = sub;
				break;
			case process.env.STRIPE_ADDON_USERS_PRICE_ID:
				addonUsersSub = sub;
				break;
			case process.env.STRIPE_ADDON_STORAGE_PRICE_ID:
				addonStorageSub = sub;
				break;
		}
	}
	// }
	return { planSub, addonUsersSub, addonStorageSub };
} 

async function getSubscriptionsDetails(stripeCustomerId: string) {
	try {
		const subscriptions = await stripe.subscriptions.list({
			customer: stripeCustomerId,
			status: 'active',
			limit: 1 // fetch only the first subscription
		});
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
			const { planSub, addonUsersSub, addonStorageSub } = await getSubscriptionsDetails(checkoutSession.customer);
			//Note: 0 to set them on else case
			await updateStripeCustomer(checkoutSession.customer, {
				stripePlan: planToPriceMap[planSub?.items.data[0].price.id],
				stripeAddons: {
					users: addonUsersSub ? addonUsersSub?.items.data[0].quantity : 0,
					storage: addonStorageSub ? addonStorageSub?.items.data[0].quantity : 0,
				},
				stripeEndsAt: planSub?.current_period_end*1000,
			});
			break;
		}

		case 'customer.subscription.updated': {
			const subscriptionUpdated = event.data.object;
			const { planSub, addonUsersSub, addonStorageSub } = destructureSubscription(subscriptionUpdated);
			//Note: null to not update them unless required
			const update = {
				stripePlan: planToPriceMap[planSub?.items.data[0].price.id],
				stripeAddons: {
					users: addonUsersSub ? addonUsersSub?.items.data[0].quantity : null,
					storage: addonStorageSub ? addonStorageSub?.items.data[0].quantity : null,
				},
				stripeEndsAt: planSub?.current_period_end ? planSub.current_period_end*1000 : null,
				stripeTrial: planSub?.status === 'trialing', // https://docs.stripe.com/api/subscriptions/object#subscription_object-status
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

export async function createPortalLink(req, res, next) {

	if (!process.env['STRIPE_ACCOUNT_SECRET']) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	if (!res.locals.account?.stripe?.stripeCustomerId) {
		return dynamicResponse(req, res, 400, { error: 'No subscription to manage' });
	}

	const { planSub } = await getSubscriptionsDetails(res.locals.account?.stripe?.stripeCustomerId);
	if (!planSub) {
		return dynamicResponse(req, res, 400, { error: 'No subscription to manage' });
	}

	//TODO: create a custom billingportal configuration https://docs.stripe.com/api/customer_portal/configurations/create

	const portalLink = await stripe.billingPortal.sessions.create({
		customer: res.locals.account?.stripe?.stripeCustomerId,
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

