'use strict';

//import {  } from '../db/stripe';
//import { dynamicResponse } from '../util';
import Stripe from 'stripe';
const stripe = new Stripe(process.env['STRIPE_ACCOUNT_SECRET']);

console.log(process.env['STRIPE_ACCOUNT_SECRET'], process.env['STRIPE_WEBHOOK_SECRET'])
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
	console.log(event);

	// Handle the event
	switch (event.type) {
		case 'payment_intent.succeeded':
			const paymentIntentSucceeded = event.data.object;
			//TODO: get stripe db object with the
			
			break;
		default:
			console.log(`Unhandled event type ${event.type}`);
	}

	// Return a 200 response to acknowledge receipt of the event
	res.status(200).send();

}
