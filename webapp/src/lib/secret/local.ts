'use strict';

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';
import SecretProvider from 'secret/provider';
dotenv.config({ path: '.env' });

class LocalSecretProvider extends SecretProvider {
	#secretClient: any;
	#cache = {};

	async getSecret(key, bypassCache = false): Promise<any> {
		return process.env[key];
	}
}

export default new LocalSecretProvider();
