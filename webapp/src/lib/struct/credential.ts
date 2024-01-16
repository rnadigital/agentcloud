'use strict';

export enum CredentialType {
	OPENAI = 'open_ai',
	AZURE = 'azure',
	LMSTUDIO = 'lmstudio',
	BEARER_TOKEN = 'bearer',
	OAUTH = 'oauth',
	// More here...
}

export const CredentialTypes = Object.values(CredentialType);
