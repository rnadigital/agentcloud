import Permissions from 'permissions/permissions';
import { ModelType, ModelTypes } from 'struct/model';

export const stripeEnvs: string[] = [
	'STRIPE_FREE_PLAN_PRICE_ID',
	'STRIPE_PRO_PLAN_PRICE_ID',
	'STRIPE_TEAMS_PLAN_PRICE_ID',
	'STRIPE_ADDON_USERS_PRICE_ID',
	'STRIPE_ADDON_STORAGE_PRICE_ID',
	'STRIPE_FREE_PLAN_PRODUCT_ID',
	'STRIPE_PRO_PLAN_PRODUCT_ID',
	'STRIPE_TEAMS_PLAN_PRODUCT_ID',
	'STRIPE_ADDON_USERS_PRODUCT_ID',
	'STRIPE_ADDON_STORAGE_PRODUCT_ID',
	'STRIPE_WEBHOOK_SECRET',
	'STRIPE_ACCOUNT_SECRET'
];

// account.stripe data
export type AccountStripeData = {
	stripeCustomerId?: string;
	stripeEndsAt?: number;
	stripeCancelled?: boolean;
	stripePlan?: SubscriptionPlan;
	stripeAddons?: {
		users?: number;
		storage?: number;
	};
	stripeTrial?: boolean;
};

export enum SubscriptionPlan {
	FREE = 'Free',
	PRO = 'Pro',
	TEAMS = 'Teams',
	ENTERPRISE = 'Enterprise'
}

export interface SubscriptionPlanConfig {
	plan: SubscriptionPlan;
	priceId: string | undefined;
	productId: string | undefined;
	storageAddon: boolean;
	usersAddon: boolean;
	title: string;
	price?: number;
	isPopular?: boolean;
	link?: string;
}

export const subscriptionPlans: SubscriptionPlanConfig[] = [
	{
		plan: SubscriptionPlan.FREE,
		priceId: process.env.STRIPE_FREE_PLAN_PRICE_ID,
		productId: process.env.STRIPE_FREE_PLAN_PRODUCT_ID,
		storageAddon: false,
		usersAddon: false,
		title: 'Agent Cloud Free',
		price: 0
	},
	{
		plan: SubscriptionPlan.PRO,
		priceId: process.env.STRIPE_PRO_PLAN_PRICE_ID,
		productId: process.env.STRIPE_PRO_PLAN_PRODUCT_ID,
		storageAddon: true,
		usersAddon: false,
		title: 'Agent Cloud Pro',
		price: 99
	},
	{
		plan: SubscriptionPlan.TEAMS,
		priceId: process.env.STRIPE_TEAMS_PLAN_PRICE_ID,
		productId: process.env.STRIPE_TEAMS_PLAN_PRODUCT_ID,
		storageAddon: true,
		usersAddon: true,
		title: 'Agent Cloud Teams',
		price: 199,
		isPopular: true
	},
	{
		plan: SubscriptionPlan.ENTERPRISE,
		priceId: undefined, //Note: would be different for every customer
		productId: process.env.STRIPE_ENTERPRISE_PLAN_PRODUCT_ID,
		/* Note: just for whether subscriptioncard should render the buttons,
		   doesnt change limits or whether the plan can actually have addons. */
		storageAddon: false,
		usersAddon: false,
		title: 'Agent Cloud Enterprise',
		link: process.env.NEXT_PUBLIC_HUBSPOT_MEETING_LINK
	}
];

// Convert subscriptionPlans to a map where the plan is the key and the object is the value
export const subscriptionPlansMap: Record<SubscriptionPlan, SubscriptionPlanConfig> =
	subscriptionPlans.reduce(
		(acc, planConfig) => {
			acc[planConfig.plan] = planConfig;
			return acc;
		},
		{} as Record<SubscriptionPlan, SubscriptionPlanConfig>
	);

export const planToPriceMap: Record<SubscriptionPlan, string | undefined> =
	subscriptionPlans.reduce(
		(acc, { plan, priceId }) => {
			acc[plan] = priceId;
			return acc;
		},
		{} as Record<SubscriptionPlan, string | undefined>
	);

export const productToPlanMap: Record<string, SubscriptionPlan> = subscriptionPlans.reduce(
	(acc, { plan, productId }) => {
		if (productId) {
			acc[productId] = plan;
		}
		return acc;
	},
	{} as Record<string, SubscriptionPlan>
);

export const priceToPlanMap: Record<string, SubscriptionPlan> = subscriptionPlans.reduce(
	(acc, { plan, priceId }) => {
		if (priceId) {
			acc[priceId] = plan;
		}
		return acc;
	},
	{} as Record<string, SubscriptionPlan>
);

export const priceToProductMap: Record<string, string> = subscriptionPlans.reduce(
	(acc, { priceId, productId }) => {
		if (productId) {
			acc[priceId] = productId;
		}
		return acc;
	},
	{} as Record<string, string>
);

export type PlanLimits = {
	users: number | 'Custom';
	permissions?: Permissions[] | number[];
	orgs: number | 'Custom';
	teams: number | 'Custom';
	/* TODO: turn all boolean types here into an array of bits and add them as permissions,
		then apply them in setpermissions middleware */
	fileUploads: boolean;
	dataConnections: boolean;
	allowedConnectors: string[];
	maxFileUploadBytes: number;
	maxVectorStorageBytes: number;
	maxFunctionTools: number;
	storageLocations: string[];
	llmModels: string[];
	embeddingModels: string[];
	cronProps: {
		disabled?: boolean;
		allowedPeriods?: string[];
		allowedDropdowns?: string[];
	};
	allowFunctionTools: boolean;
	//TODO: keep updated to agentcloud priing sheet
};

// This utility type extracts the keys from PlanLimits and maps them to the same value as the key
type PlanLimitsKeysType = {
	[K in keyof PlanLimits]: K;
};

// Create a const object with keys that match the PlanLimits type
export const PlanLimitsKeys: PlanLimitsKeysType = {
	users: 'users',
	permissions: 'permissions',
	orgs: 'orgs',
	teams: 'teams',
	fileUploads: 'fileUploads',
	dataConnections: 'dataConnections',
	allowedConnectors: 'allowedConnectors',
	maxFileUploadBytes: 'maxFileUploadBytes',
	maxVectorStorageBytes: 'maxVectorStorageBytes',
	maxFunctionTools: 'maxFunctionTools',
	storageLocations: 'storageLocations',
	llmModels: 'llmModels',
	embeddingModels: 'embeddingModels',
	cronProps: 'cronProps',
	allowFunctionTools: 'allowFunctionTools'
};

// Object to hold the limits for each plan, using computed property names
export type PricingMatrix = {
	[key in SubscriptionPlan]: PlanLimits;
};

//TODO: change this
enum Connectors {
	ONEDRIVE = '01d1c685-fd4a-4837-8f4c-93fe5a0d2188',
	GOOGLE_DRIVE = '9f8dda77-1048-4368-815b-269bf54ee9b8',
	POSTGRES = 'decd338e-5647-4c0b-adf4-da0e75f5a750',
	HUBSPOT = '36c891d9-4bd9-43ac-bad2-10e12756272c',
	GOOGLE_BIGQUERY = 'bfd1ddf8-ae8a-4620-b1d7-55597d2ba08c',
	AIRTABLE = '14c6e7ea-97ed-4f5e-a7b5-25e9a80b8212',
	NOTION = '6e00b415-b02e-4160-bf02-58176a0ae687'
}

export const pricingMatrix: PricingMatrix = {
	[SubscriptionPlan.FREE]: {
		users: 1,
		orgs: 1,
		teams: 1,
		fileUploads: true,
		dataConnections: false,
		allowedConnectors: [],
		maxFileUploadBytes: 5 * 1024 * 1024, //5MB
		maxVectorStorageBytes: 100 * 1024 * 1024, //100MB
		maxFunctionTools: 1,
		storageLocations: ['US'],
		llmModels: [ModelType.OPENAI],
		embeddingModels: [ModelType.OPENAI],
		cronProps: {
			disabled: true
		},
		allowFunctionTools: false
	},
	[SubscriptionPlan.PRO]: {
		users: 1,
		orgs: 1,
		teams: 1,
		fileUploads: true,
		dataConnections: true,
		allowedConnectors: [
			Connectors.ONEDRIVE,
			Connectors.POSTGRES,
			Connectors.HUBSPOT,
			Connectors.GOOGLE_BIGQUERY,
			Connectors.AIRTABLE,
			Connectors.NOTION
		],
		maxFileUploadBytes: 25 * 1024 * 1024, //25MB
		maxVectorStorageBytes: 1 * 1024 * 1024 * 1024, //1GB
		maxFunctionTools: 10,
		storageLocations: ['US'],
		llmModels: [ModelType.OPENAI, ModelType.ANTHROPIC],
		embeddingModels: [ModelType.OPENAI, ModelType.ANTHROPIC],
		cronProps: {
			allowedPeriods: ['year', 'month', 'week', 'day'],
			//allowedDropdowns: ['period', 'months', 'month-days']
			allowedDropdowns: ['period']
		},
		allowFunctionTools: false
	},
	[SubscriptionPlan.TEAMS]: {
		users: 10,
		orgs: 1,
		teams: 3,
		fileUploads: true,
		dataConnections: true,
		allowedConnectors: [],
		maxFileUploadBytes: 50 * 1024 * 1024, //50MB
		maxVectorStorageBytes: 10 * 1024 * 1024 * 1024, //10GB
		maxFunctionTools: 20,
		storageLocations: ['US'],
		llmModels: ModelTypes,
		embeddingModels: ModelTypes,
		cronProps: {
			allowedPeriods: ['year', 'month', 'week', 'day', 'hour'],
			//allowedDropdowns: ['period', 'months', 'month-days', 'hours'],
			allowedDropdowns: ['period']
		},
		allowFunctionTools: true
	},
	[SubscriptionPlan.ENTERPRISE]: {
		//TODO
		users: 10 ** 6,
		orgs: 10 ** 6,
		teams: 10 ** 6,
		fileUploads: true,
		dataConnections: true,
		allowedConnectors: [],
		maxFileUploadBytes: 1 * 1024 * 1024 * 1024, //1GB (until we have "custom")
		maxVectorStorageBytes: 10 * 1024 * 1024 * 1024, //10GB
		maxFunctionTools: 10,
		storageLocations: ['US'],
		llmModels: ModelTypes,
		embeddingModels: ModelTypes,
		cronProps: {
			allowedPeriods: ['year', 'month', 'week', 'day', 'hour', 'minute'],
			allowedDropdowns: ['period']
		},
		allowFunctionTools: true
	}
};
