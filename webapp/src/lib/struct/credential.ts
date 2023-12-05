'use strict';

//TODO: rename "type" or something
export enum CredentialPlatform {
	OPENAI = 'open_ai',
	AZURE = 'azure',
	BEARER_TOKEN = 'bearer',
	OAUTH = 'oauth',
	//TODO: more
}

export const CredentialPlatforms = Object.values(CredentialPlatform);
