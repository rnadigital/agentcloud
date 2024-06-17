'use strict';

export enum ModelType {
  OPENAI = 'open_ai',
  FASTEMBED = 'fastembed',
  OLLAMA = 'ollama',
  COHERE = 'cohere',
  ANTHROPIC = 'anthropic',
  GROQ = 'groq'
}

export const ModelTypes = Object.values(ModelType);

interface ModelRequirements {
  [key: string]: string | boolean; // Key is the field name, value is its type or existence
}

export const ModelTypeRequirements: Record<ModelType, ModelRequirements> = {
	[ModelType.OPENAI]: {
		api_key: 'string',
	},
	[ModelType.FASTEMBED]: {},
	[ModelType.OLLAMA]: {
		base_url: 'string',
		api_key: 'string',
	},
	[ModelType.COHERE]: {
		cohere_api_key: 'string',
	},
	[ModelType.ANTHROPIC]: {
		api_key: 'string',
	},
	[ModelType.GROQ]: {
		groq_api_key: 'string',
	},
  // Add more types here if needed
};


export const ModelList = {
	[ModelType.OPENAI]: [
		'gpt-4o',
		'gpt-4o-2024-05-13',
		'gpt-4-turbo',
		'gpt-4-turbo-2024-04-09',
		'gpt-4-turbo-preview',
		'gpt-4-0125-preview',
		'gpt-4-1106-preview',
		'gpt-4-vision-preview',
		'gpt-4-1106-vision-preview',
		'gpt-4',
		'gpt-4-0613',
		'gpt-4-32k',
		'gpt-4-32k-0613',
		'gpt-3.5-turbo-0125',
		'gpt-3.5-turbo',
		'gpt-3.5-turbo-1106',
		'gpt-3.5-turbo-instruct',
		'gpt-3.5-turbo-16k',
		'gpt-3.5-turbo-0613',
		'gpt-3.5-turbo-16k-0613',
		'text-embedding-3-large',
		'text-embedding-3-small',
		'text-embedding-ada-002'
	],
	[ModelType.FASTEMBED]: [
		'fast-bge-small-en',
		'fast-bge-small-en-v1.5',
		'fast-bge-base-en',
		'fast-bge-base-en-v1.5',
		'fast-all-MiniLM-L6-v2',
		'fast-multilingual-e5-large'
	],
	[ModelType.OLLAMA]: [
		'llama2',
		'llama3',
		'llama3:8b',
		'llama3:70b',
		'llama3:70b-instruct',
		'dolphin-llama3:256k',
		'dolphin-llama3:70b',
		'dolphin-llama3:8b-256k',
		'phi3',
		'phi3:instruct',
		'llama3:8b-instruct-fp16',
		'mixtral:instruct',
		'nomic-embed-text',
	],
	[ModelType.COHERE]: [
		'command-r-plus',
	],
	[ModelType.ANTHROPIC]: [
		'claude-3-opus-20240229',
		'claude-3-sonnet-20240229',
		'claude-3-haiku-20240307',
	],
	[ModelType.GROQ]: [
		'llama3-70b-8192',
		'mixtral-8x7b-32768'
	],
};

export const ModelEmbeddingLength = {
	'text-embedding-3-large': 3072,
	'text-embedding-3-small': 1536,
	'text-embedding-ada-002': 1536,
	'fast-bge-small-en': 384,
	'fast-bge-small-en-v1.5': 384,
	'fast-bge-base-en': 768,
	'fast-bge-base-en-v1.5': 768,
	'fast-bge-small-zh-v1.5': 512,
	'fast-all-MiniLM-L6-v2': 384,
	'fast-multilingual-e5-large': 1024,
	'nomic-embed-text': 8192,
};
