'use strict';

export enum ModelType {
	OPENAI = 'open_ai',
	AZURE_OPENAI = 'azure',
	FASTEMBED = 'fastembed',
	OLLAMA = 'ollama',
	// COHERE = 'cohere',
	ANTHROPIC = 'anthropic',
	GROQ = 'groq',
	GOOGLE_VERTEX = 'google_vertex',
	GOOGLE_AI = 'google_ai'
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
	},
	{
		value: ModelType.GOOGLE_AI,
		label: 'Google AI',
		iconURL: '/images/onboarding/google-ai-studio.svg'
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
	},
	[ModelType.GOOGLE_AI]: {
		api_key: { type: 'text' }
	}
};

export const ModelList = {
	[ModelType.OPENAI]: [
		'gpt-4o-mini',
		'gpt-4o',
		'gpt-4-turbo',
		'gpt-4',
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
		'llama3.1',
		'llama3-groq-tool-use',
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
	[ModelType.GROQ]: [
		'llama3-70b-8192',
		'mixtral-8x7b-32768',
		'llama3-groq-8b-8192-tool-use-preview',
		'llama3-groq-70b-8192-tool-use-preview'
	],
	[ModelType.GOOGLE_VERTEX]: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
	[ModelType.GOOGLE_AI]: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
	[ModelType.AZURE_OPENAI]: [
		'gpt-4o-mini',
		'gpt-4o',
		'gpt-4'
		/* Note: Don't uncomment these until: https://github.com/rnadigital/agentcloud/issues/396
		'text-embedding-3-small',
		'text-embedding-3-large',
		'text-embedding-ada-002'*/
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

export const ModelContextWindow = {
	/**add/modify these as required */ 'gpt-4o-mini': 128000,
	'gpt-4o': 128000,
	'gpt-4-turbo': 128000,
	'gpt-4': 8192,
	llama2: 4096,
	llama3: 128000,
	'llama3:8b': 8192,
	'llama3:70b': 128000,
	'llama3:70b-instruct': 8000,
	'dolphin-llama3:256k': 256000,
	'dolphin-llama3:70b': 256000,
	'dolphin-llama3:8b-256k': 256000,
	phi3: 0,
	'phi3:instruct': 0,
	'llama3:8b-instruct-fp16': 8192,
	'mixtral:instruct': 32768,
	'claude-3-5-sonnet-20240620': 200000,
	'claude-3-sonnet-20240229': 200000,
	'claude-3-opus-20240229': 200000,
	'claude-3-haiku-20240307': 200000,
	'llama3-70b-8192': 8000,
	'mixtral-8x7b-32768': 32000,
	'gemini-1.5-pro': 2000000,
	'gemini-1.5-flash': 1000000,
	'gemini-1.0-pro': 33000
};

export const ModelKnowledgeCutoff = {
	'gpt-4o-mini': new Date('2023-10-01'),
	'gpt-4o': new Date('2023-10-01'),
	'gpt-4-turbo': new Date('2023-12-01'),
	'gpt-4': new Date('2021-09-01'),
	llama2: new Date('2023-07-01'),
	llama3: new Date('2023-12-01'),
	'llama3:8b': new Date('2023-03-01'),
	'llama3:70b': new Date('2023-12-01'),
	'llama3:70b-instruct': new Date('2023-12-01'),
	'dolphin-llama3:256k': null,
	'dolphin-llama3:70b': null,
	'dolphin-llama3:8b-256k': null,
	phi3: new Date('2023-10-01'),
	'phi3:instruct': new Date('2023-10-01'),
	'llama3:8b-instruct-fp16': new Date('2023-03-01'),
	'mixtral:instruct': new Date('2023-12-01'),
	'claude-3-5-sonnet-20240620': new Date('2024-04-01'),
	'claude-3-sonnet-20240229': new Date('2023-08-01'),
	'claude-3-opus-20240229': new Date('2023-08-01'),
	'claude-3-haiku-20240307': new Date('2023-08-01'),
	'llama3-70b-8192': new Date('2023-12-01'),
	'mixtral-8x7b-32768': new Date('2021-09-01'),
	'gemini-1.5-pro': new Date('2023-11-01'),
	'gemini-1.5-flash': new Date('2023-11-01'),
	'gemini-1.0-pro': new Date('2023-11-01')
};

export const ChatAppAllowedModels = new Set([
	ModelType.OPENAI,
	ModelType.ANTHROPIC,
	ModelType.GOOGLE_VERTEX,
	ModelType.GOOGLE_AI,
	ModelType.AZURE_OPENAI,
	ModelType.OLLAMA,
	ModelType.GROQ
]);
