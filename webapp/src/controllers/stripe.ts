'use strict';

import { dynamicResponse } from '@dr';
import Stripe from 'stripe';
import { planToPriceMap, priceToPlanMap,SubscriptionPlan } from 'struct/billing';

import { setStripeCustomerId, setStripePlan, unsetStripeCustomer, updateStripeCustomer } from '../db/account';
import { addCheckoutSession, getCheckoutSessionByAccountId } from '../db/checkoutsession';
import { addPaymentLink, unsafeGetPaymentLinkById } from '../db/paymentlink';
import { addPortalLink } from '../db/portallink';
import toObjectId from '../lib/misc/toobjectid';
const stripe = new Stripe(process.env['STRIPE_ACCOUNT_SECRET']);
import debug from 'debug';
const log = debug('webapp:stripe');

async function getFirstActiveSubscription(stripeCustomerId: string) {
	try {
		const subscriptions = await stripe.subscriptions.list({
			customer: stripeCustomerId,
			status: 'active',
			limit: 1 // fetch only the first subscription
		});
		if (subscriptions.data.length > 0) {
			return subscriptions.data[0]; // return the first active subscription
		} else {
			return null; // no active subscriptions found
		}
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
		case 'checkout.session.completed':
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
			const activeSub = await getFirstActiveSubscription(checkoutSession.customer);
			if (activeSub) {
				await updateStripeCustomer(activeSub.customer as string, activeSub.current_period_end*1000);
			}
			break;
//		case 'customer.subscription.created':
//			const subscriptionCreated = event.data.object;
//			const activeSub = await getFirstActiveSubscription(subscriptionCreated.customer);
//			console.log('activeSub', activeSub)
//			if (activeSub) {
//				await updateStripeCustomer(activeSub.customer as string, activeSub.current_period_end*1000);
//			}
//			break;
		case 'customer.subscription.updated':
			const subscriptionUpdated = event.data.object;
			//TODO: check if its the PLAN and update them, if its an addon don't bother
			if (subscriptionUpdated.current_period_end) {
				await updateStripeCustomer(subscriptionUpdated.customer, subscriptionUpdated.current_period_end*1000);
			}
			if (subscriptionUpdated['cancel_at_period_end'] === true) {
				log(`${subscriptionUpdated.customer} subscription will cancel at end of period`);
				await updateStripeCustomer(subscriptionUpdated.customer, subscriptionUpdated.cancel_at, true);
			}
			if (subscriptionUpdated['status'] === 'canceled') {
				log(`${subscriptionUpdated.customer} canceled their subscription`);
				// await unsetStripeCustomer(subscriptionUpdated.customer);
			}
			//WIP
			if (subscriptionUpdated?.items?.data?.length > 0) {
				let planId;
				for (let item of subscriptionUpdated?.items?.data) {
					console.log(item);
					const itemPriceId = item?.plan?.id;
					if (priceToPlanMap[itemPriceId]) {
						log(`Found plan with itemPriceId: ${itemPriceId}, Plan: ${priceToPlanMap[itemPriceId]}`);
						await setStripePlan(subscriptionUpdated.customer, priceToPlanMap[itemPriceId]);
					} else {
						log(`No plan with itemPriceId: ${itemPriceId}`);
					}
				}
			}
			break;
		case 'customer.subscription.deleted':
			//TODO: check if its the PLAN or addons being unsubbed
			const subscriptionDeleted = event.data.object;
			await unsetStripeCustomer(subscriptionDeleted.customer);
			break;
		default:
			log(`Unhandled stripe webhook event type "${event.type}"`);
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

	const activeSub = await getFirstActiveSubscription(res.locals.account?.stripe?.stripeCustomerId);
	if (!activeSub) {
		return dynamicResponse(req, res, 400, { error: 'No subscription to manage' });
	}

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

export async function createPaymentLink(req, res, next) {

	const { plan } = req.body;
	if (!Object.values(SubscriptionPlan).includes(plan)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid plan selection' });
	}

	const priceId = planToPriceMap[plan]; //TODO: wheres the best place to store this?

	if (!process.env['STRIPE_ACCOUNT_SECRET']) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	if (res.locals.account?.stripe?.stripeCustomerId) {
		return dynamicResponse(req, res, 400, { error: 'Already subscribed' });
	}

	const paymentLink = await stripe.paymentLinks.create({
		line_items: [
			{
				price: priceId,
				quantity: 1,
			},
		],
		after_completion: {
			type: 'redirect',
			redirect: {
				url: `${process.env.URL_APP}/auth/redirect?to=${encodeURIComponent('/billing')}`,
			},
		},
	});

	await addPaymentLink({
		accountId: toObjectId(res.locals.account._id),
		paymentLinkId: paymentLink.id,
		url: paymentLink.url,
		payload: paymentLink,
		createdDate: new Date(),
	});

	return dynamicResponse(req, res, 302, { redirect: paymentLink.url });

}

export async function changePlanApi(req, res, next) {

	const { priceId } = req.body;
	if (!priceId) { //TODO: check if valid priceId
		return dynamicResponse(req, res, 400, { error: 'Invalid plan selection' });
	}

	const stripeCustomerId = res.locals.account?.stripe?.stripeCustomerId;
	
	const currentSubscription = await getFirstActiveSubscription(stripeCustomerId);
	if (!currentSubscription) {
		const paymentLink = await stripe.paymentLinks.create({
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			after_completion: {
				type: 'redirect',
				redirect: {
					url: `${process.env.URL_APP}/auth/redirect?to=${encodeURIComponent('/billing')}`,
				},
			},
		});
		await addPaymentLink({
			accountId: toObjectId(res.locals.account._id),
			paymentLinkId: paymentLink.id,
			url: paymentLink.url,
			payload: paymentLink,
			createdDate: new Date(),
		});
		return dynamicResponse(req, res, 302, { redirect: paymentLink.url });
	}

	// Update the subscription with the new plan, handling pro-rated charges
	const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
		items: [{
			id: currentSubscription.items.data[0].id,
			price: priceId,
		}],
		proration_behavior: 'always_invoice', // Ensure pro-ration is billed
	});

	// TODO: respond with the updated subscription details??
	return dynamicResponse(req, res, 200, { /**/ });

}
