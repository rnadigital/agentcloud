'use strict';

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

let secretClient;
if (process.env.PROJECT_ID) {
	const secretClientOptions = { projectId: process.env.PROJECT_ID };
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		secretClientOptions['keyFilename'] = process.env.GOOGLE_APPLICATION_CREDENTIALS;
	}
	secretClient = new SecretManagerServiceClient(secretClientOptions);
}
const cache = {};

export async function getSecret(key, bypassCache = false) {
	if (cache[key] && !bypassCache) {
		return cache[key];
	}
	if (process.env[key]
		&& typeof process.env[key] === 'string'
		&& process.env[key].length > 0) {
		return cache[key] = process.env[key];
	}
	if (secretClient) {
		try {
			const [secretVal] = await secretClient.accessSecretVersion({
				name: `projects/${process.env.PROJECT_ID}/secrets/${key}/versions/latest`,
			});
			const secretValue = Buffer.from(new TextDecoder().decode(<Uint8Array>(secretVal.payload.data)), 'utf-8').toString();
			return cache[key] = secretValue; //set in cache and return
		} catch (e) {
			console.warn(e);
		}
	}
	return null;
}

// I don't think we need these
// export async function setSecret() { ... }
// export async function deleteSecret() { ... }
