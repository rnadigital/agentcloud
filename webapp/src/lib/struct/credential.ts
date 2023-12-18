'use strict';

//TODO: rename "type" or something
export enum CredentialPlatform {
	OPENAI = 'open_ai',
	AZURE = 'azure',
	LMSTUDIO = 'lmstudio',
	BEARER_TOKEN = 'bearer',
	OAUTH = 'oauth',
	//TODO: more
}

export const CredentialPlatforms = Object.values(CredentialPlatform);
