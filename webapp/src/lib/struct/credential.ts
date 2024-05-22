'use strict';

export enum CredentialType {
	OPENAI = 'open_ai',
	FASTEMBED = 'fastembed',
	OLLAMA = 'ollama',
	COHERE = 'cohere',
	ANTHROPIC = 'anthropic',
}

export const CredentialTypes = Object.values(CredentialType);

interface CredentialRequirements {
    [key: string]: string | boolean; // Key is the field name, value is its type or existence
}

export const CredentialTypeRequirements: Record<CredentialType, CredentialRequirements> = {
	[CredentialType.OPENAI]: {
	
	},
	[CredentialType.FASTEMBED]: {
	
	},
	[CredentialType.OLLAMA]: {
		base_url: 'string',
		api_key: 'string',
	},
	[CredentialType.COHERE]: {
		cohere_api_key: 'string',
	},
	[CredentialType.ANTHROPIC]: {
		api_key: 'string',
	},
    // Add more types here if needed
};
