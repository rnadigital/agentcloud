'use strict';

export enum CredentialType {
	OPENAI = 'open_ai',
	OAUTH = 'oauth',
	FASTEMBED = 'fastembed',
	// More here...
}

export const CredentialTypes = Object.values(CredentialType);
