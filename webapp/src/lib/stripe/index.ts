import Stripe from 'stripe';
export const stripe = new Stripe(process.env['STRIPE_ACCOUNT_SECRET']);
