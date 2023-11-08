'use strict';

export enum CredentialPlatform {
	OPENAI = 'open_ai',
	AZURE = 'azure',
	//TODO: more
}
export const CredentialPlatforms = Object.values(CredentialPlatform);
