'use strict';

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import SecretProvider from 'secret/provider';
import { createLogger } from 'utils/logger';

const log = createLogger('webapp:secret:google');

class GoogleSecretProvider extends SecretProvider {
	#secretClient: any;
	#cache = {};

	async init() {
		if (process.env.PROJECT_ID) {
			const secretClientOptions = { projectId: process.env.PROJECT_ID };
			if (process.env.LOCAL && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
				secretClientOptions['keyFilename'] = process.env.GOOGLE_APPLICATION_CREDENTIALS;
			}
			log.info('GoogleSecretProvider options:', secretClientOptions);
			this.#secretClient = new SecretManagerServiceClient(secretClientOptions);
		}
		this.#cache = {};
	}

	async getSecret(key, bypassCache = false) {
		if (this.#cache[key] && !bypassCache) {
			return this.#cache[key];
		}
		try {
			const [secretVal] = await this.#secretClient.accessSecretVersion({
				name: `projects/${process.env.PROJECT_ID}/secrets/${key}/versions/latest`
			});
			const secretValue = Buffer.from(
				new TextDecoder().decode(<Uint8Array>secretVal.payload.data),
				'utf-8'
			).toString();
			return (this.#cache[key] = secretValue); //set in cache and return
		} catch (e) {
			console.warn(e);
			return null;
		}
	}
}

export default new GoogleSecretProvider();
