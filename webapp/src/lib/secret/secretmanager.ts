'use strict';

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretClientOptions = { projectId: process.env.PROJECT_ID };
if (process.env.SECRET_KEYFILE) {
	secretClientOptions['keyFilename'] = process.env.SECRET_KEYFILE;
}
const secretClient = new SecretManagerServiceClient(secretClientOptions);
const cache = {};

export async function getSecret(key, bypassCache = false) {
	if (cache[key] && !bypassCache) {
		return cache[key];
	}
	const [secretVal] = await secretClient.accessSecretVersion({
		name: `projects/${process.env.PROJECT_ID}/secrets/${key}/versions/latest`,
	});
	const secretValue = Buffer.from(new TextDecoder().decode(<Uint8Array>(secretVal.payload.data)), 'utf-8').toString();
	return cache[key] = secretValue; //set in cache and return
}

// I don't think we need these
// export async function setSecret() { ... }
// export async function deleteSecret() { ... }
