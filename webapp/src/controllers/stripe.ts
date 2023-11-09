'use strict';

//import {  } from '../db/stripe';
import { dynamicResponse } from '../util';
import Stripe from 'stripe';
const stripe = new Stripe(process.env['STRIPE_ACCOUNT_SECRET']);

/**
 * @api {post} /stripe-webhook
 */
export async function webhookHandler(req, res, next) {

	const sig = req.headers['stripe-signature'];
	let event;
	try {
		event = stripe.webhooks.constructEvent(req.body, sig, process.env['STRIPE_WEBHOOK_SECRET']);
	} catch (err) {
		console.warn(err);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	console.log('event', event);

	// Handle the event
	switch (event.type) {
		case 'checkout.session.completed':
			const checkoutSessionCompleted = event.data.object;
			const paymentLink = checkoutSessionCompleted?.data?.object?.payment_link;
			if (!paymentLink) {
				console.warn('Completed checkout session without .data.object.payment_link:', checkoutSessionCompleted);
			} else {
				//TODO: fetch payment link from the db, set the user as subscribed
			}
			break;
		//TODO: handle cancel/subscription update events
		default:
			console.log(`Unhandled event type ${event.type}`);
	}

	// Return a 200 response to acknowledge receipt of the event
	res.status(200).send();

}

export async function createPaymentLink(req, res, next) {

	const paymentLink = await stripe.paymentLinks.create({
		line_items: [
			{
				price: 'price_1OAMHSDxQ9GZKzvoBbDryhiZ', //TODO: put in env or a secret?
				quantity: 1,
			},
		],
	});

	console.log('paymentLink', paymentLink);
	//TODO: insert the payment link into the db with the userId

	return dynamicResponse(req, res, 302, { redirect: paymentLink.url });

}
