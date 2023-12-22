'use strict';

//TODO: rename "CredentialType" or something?
export enum CredentialPlatform {
	OPENAI = 'open_ai',
	AZURE = 'azure',
	LMSTUDIO = 'lmstudio',
	BEARER_TOKEN = 'bearer',
	OAUTH = 'oauth',
	// More here...
}

export const CredentialPlatforms = Object.values(CredentialPlatform);
