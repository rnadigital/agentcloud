'use strict';

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';
import SecretProvider from 'secret/provider';
dotenv.config({ path: '.env' });

class HubspotSecretProvider extends SecretProvider {
	#secretClient: any;
	#cache = {};

	async getSecret(key = "", bypassCache = false): Promise<any> {
        const clientId = process.env.OAUTH_HUBSPOT_CLIENT_ID;
        const clientSecret = process.env.OAUTH_HUBSPOT_CLIENT_SECRET;
		return {clientId, clientSecret};
	}
}

export default new HubspotSecretProvider();