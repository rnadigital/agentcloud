import debug from 'debug';
import SecretProviderFactory from 'secret/index';
import SecretKeys from 'secret/secretkeys';
import Stripe from 'stripe';
const log = debug('webapp:stripe');

class StripeClient {
	#stripeClient;

	async init() {
		log('Initializing stripe client');
		try {
			// Get stripe secret
			const secretProvider = SecretProviderFactory.getSecretProvider();
			const STRIPE_ACCOUNT_SECRET = await secretProvider.getSecret(
				SecretKeys.STRIPE_ACCOUNT_SECRET
			);

			// Initialize the Stripe client
			this.#stripeClient = new Stripe(STRIPE_ACCOUNT_SECRET);
		} catch (e) {
			log(e);
		}
		log('Stripe client initialized');
	}

	get() {
		return this.#stripeClient;
	}
}

export default new StripeClient();
