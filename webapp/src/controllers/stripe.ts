'use strict';

import { addPaymentLink, unsafeGetPaymentLinkById } from '../db/paymentlink';
import { addCheckoutSession, unsafeGetCheckoutSessionById } from '../db/checkoutsession';
import toObjectId from '../lib/misc/toobjectid';
import { dynamicResponse } from '../util';
import Stripe from 'stripe';
const stripe = new Stripe(process.env['STRIPE_ACCOUNT_SECRET']);
import debug from 'debug';
const log = debug('webapp:stripe');

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

	log(`Stripe webhook "${event.type}":`, event);

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
			//TODO:create stripe customer
			
			break;
		//TODO: handle cancel/subscription update events
		default:
			log(`Unhandled stripe webhook event type "${event.type}"`);
	}

	// Return a 200 response to acknowledge receipt of the event
	res.status(200).send();

}

export async function createPaymentLink(req, res, next) {

	if (!process.env['STRIPE_ACCOUNT_SECRET']) {
		return dynamicResponse(req, res, 400, { error: 'Missing STRIPE_ACCOUNT_SECRET' });
	}

	const paymentLink = await stripe.paymentLinks.create({
		line_items: [
			{
				price: 'price_1OAMHSDxQ9GZKzvoBbDryhiZ', //TODO: put in env or a secret?
				quantity: 1,
			},
		],
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
