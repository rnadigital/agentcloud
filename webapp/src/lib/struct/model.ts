'use strict';

export enum ModelType {
	OPENAI = 'open_ai',
	AZURE_OPENAI = 'azure',
	FASTEMBED = 'fastembed',
	OLLAMA = 'ollama',
	// COHERE = 'cohere',
	ANTHROPIC = 'anthropic',
	GROQ = 'groq',
	GOOGLE_VERTEX = 'google_vertex'
}

export const modelOptions = [
	{
		value: ModelType.OPENAI,
		label: 'OpenAI',
		iconURL: '/images/onboarding/openai.svg',
		recommended: true
	},
	{
		value: ModelType.AZURE_OPENAI,
		label: 'Azure OpenAI',
		iconURL: '/images/onboarding/azure-openai.svg'
	},
	{ value: ModelType.ANTHROPIC, label: 'Anthropic', iconURL: '/images/onboarding/anthropic.svg' },
	{ value: ModelType.OLLAMA, label: 'Ollama', iconURL: '/images/onboarding/ollama.svg' },
	{ value: ModelType.FASTEMBED, label: 'FastEmbed', iconURL: '/images/onboarding/fastembed.svg' },
	// { value: ModelType.COHERE, label: 'Cohere', iconURL: '/images/onboarding/cohere.png' },
	{ value: ModelType.GROQ, label: 'Groq', iconURL: '/images/onboarding/groq.svg' },
	{
		value: ModelType.GOOGLE_VERTEX,
		label: 'Google Vertex',
		iconURL: '/images/onboarding/google-vertex.svg'
	}
];

export const ModelTypes = Object.values(ModelType);

export interface FieldRequirement {
	type: string;
	optional?: boolean;
	tooltip?: string;
	placeholder?: string;
	inputProps?: any;
}

export interface ModelRequirements {
	[key: string]: FieldRequirement;
}

export const ModelTypeRequirements: Record<ModelType, ModelRequirements> = {
	[ModelType.OPENAI]: {
		api_key: { type: 'text' },
		org_id: { type: 'text', optional: true }
	},
	[ModelType.AZURE_OPENAI]: {
		api_key: { type: 'text' },
		azure_endpoint: { type: 'text', placeholder: 'eg. https://xyz.openai.azure.com' },
		azure_deployment: { type: 'text' },
		api_version: { type: 'text', placeholder: 'eg. 2024-02-15-preview' }
	},
	[ModelType.FASTEMBED]: {},
	[ModelType.OLLAMA]: {
		base_url: { type: 'text', tooltip: 'Ollama URL (not localhost)' },
		api_key: { type: 'text' }
	},
	// [ModelType.COHERE]: {
	// 	cohere_api_key: { type: 'text' }
	// },
	[ModelType.ANTHROPIC]: {
		api_key: { type: 'text' }
	},
	[ModelType.GROQ]: {
		groq_api_key: { type: 'text' }
	},
	[ModelType.GOOGLE_VERTEX]: {
		credentials: { type: 'text', tooltip: 'GCP service account JSON', placeholder: '{ ... }' },
		temperature: {
			type: 'range',
			inputProps: { min: 0, max: 1, step: 0.01 },
			optional: true,
			tooltip: 'Model temperature'
		},
		location: {
			type: 'text',
			optional: true,
			tooltip: 'GCP location',
			placeholder: 'us-central1'
		},
		project: { type: 'text', tooltip: 'GCP project name' }
	}
};

export const ModelList = {
	[ModelType.OPENAI]: [
		'gpt-4o-mini',
		'gpt-4o',
		'gpt-4-turbo',
		'gpt-4',
		'gpt-3.5-turbo',
		'text-embedding-3-small',
		'text-embedding-3-large',
		'text-embedding-ada-002'
	],
	[ModelType.FASTEMBED]: [
		'fast-bge-small-en',
		'fast-bge-base-en',
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
		'nomic-embed-text'
	],
	// [ModelType.COHERE]: ['command-r-plus'],
	[ModelType.ANTHROPIC]: [
		'claude-3-5-sonnet-20240620',
		'claude-3-sonnet-20240229',
		'claude-3-opus-20240229',
		'claude-3-haiku-20240307'
	],
	[ModelType.GROQ]: ['llama3-70b-8192', 'mixtral-8x7b-32768'],
	[ModelType.GOOGLE_VERTEX]: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
	[ModelType.AZURE_OPENAI]: [
		'gpt-4o-mini',
		'gpt-4o',
		'gpt-4',
		'text-embedding-3-small',
		'text-embedding-3-large',
		'text-embedding-ada-002'
	]
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
	'nomic-embed-text': 8192
};

export const ChatAppAllowedModels = new Set([
	ModelType.OPENAI,
	ModelType.ANTHROPIC,
	ModelType.GOOGLE_VERTEX,
	ModelType.AZURE_OPENAI
]);
