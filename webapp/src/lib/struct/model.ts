'use strict';

import { CredentialType } from 'struct/credential';

export const ModelList = {
	[CredentialType.OPENAI]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview', 'text-embedding-3-large', 'text-embedding-3-small', 'text-embedding-ada-002'],
	[CredentialType.AZURE]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'],
	[CredentialType.LMSTUDIO]: null,
};

export const ModelEmbeddingLength = {
	'text-embedding-3-large': 3072,
	'text-embedding-3-small': 1536,
	'text-embedding-ada-002': 1536,
};
