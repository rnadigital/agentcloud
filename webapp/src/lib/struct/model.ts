'use strict';

import { CredentialType } from 'struct/credential';

export const ModelList = {
	[CredentialType.OPENAI]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview', 'text-embedding-3-large', 'text-embedding-3-small', 'text-embedding-ada-002'],
	[CredentialType.AZURE]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'],
	[CredentialType.LMSTUDIO]: null,
	[CredentialType.FASTEMBED]: [
		'BAAI/bge-small-en',
		'BAAI/bge-small-en-v1.5',
		'BAAI/bge-base-en',
		'BAAI/bge-base-en-v1.5',
		'BAAI/fast-bge-small-zh-v1.5',
		'entence-transformers/all-MiniLM-L6-v2',
		'xenova/fast-multilingual-e5-large'],
};

export const ModelEmbeddingLength = {
	'text-embedding-3-large': 3072,
	'text-embedding-3-small': 1536,
	'text-embedding-ada-002': 1536,
	'BAAI/bge-small-en': 384,
	'BAAI/bge-small-en-v1.5': 384,
	'BAAI/bge-base-en': 768,
	'BAAI/bge-base-en-v1.5': 786,
	'BAAI/fast-bge-small-zh-v1.5': 512,
	'entence-transformers/all-MiniLM-L6-v2': 384,
	'xenova/fast-multilingual-e5-large': 1024,
};
