import Permissions from 'permissions/permissions';
import { CredentialType, CredentialTypes } from 'struct/credential';

type SubscriptionPlanConfig = {
    plan: SubscriptionPlan;
    priceId: string | undefined;
};

export enum SubscriptionPlan {
    FREE = 'Free',
    PRO = 'Pro',
    TEAMS = 'Teams',
    ENTERPRISE = 'Enterprise'
}

export const subscriptionPlans: SubscriptionPlanConfig[] = [
	{ plan: SubscriptionPlan.FREE, priceId: process.env.STRIPE_FREE_PLAN_PRICE_ID },
	{ plan: SubscriptionPlan.PRO, priceId: process.env.STRIPE_PRO_PLAN_PRICE_ID },
	{ plan: SubscriptionPlan.TEAMS, priceId: process.env.STRIPE_TEAMS_PLAN_PRICE_ID },
];

export const planToPriceMap: Record<SubscriptionPlan, string | undefined> = subscriptionPlans.reduce((acc, { plan, priceId }) => {
	acc[plan] = priceId;
	return acc;
}, {} as Record<SubscriptionPlan, string | undefined>);

export const priceToPlanMap: Record<string, SubscriptionPlan> = subscriptionPlans.reduce((acc, { plan, priceId }) => {
	if (priceId) {
		acc[priceId] = plan; // Check for undefined to ensure type safety
	}
	return acc;
}, {} as Record<string, SubscriptionPlan>);

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
	storageLocations: string[];
	llmModels: string[];
	embeddingModels: string[];
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
	storageLocations: 'storageLocations',
	llmModels: 'llmModels',
	embeddingModels: 'embeddingModels',
};

// Object to hold the limits for each plan, using computed property names
export type PricingMatrix = {
    [key in SubscriptionPlan]: PlanLimits;
}

//TODO: change this
enum Connectors {
	ONEDRIVE = '01d1c685-fd4a-4837-8f4c-93fe5a0d2188',
	GOOGLE_DRIVE = '9f8dda77-1048-4368-815b-269bf54ee9b8',
	POSTGRES = 'decd338e-5647-4c0b-adf4-da0e75f5a750',
	HUBSPOT = '36c891d9-4bd9-43ac-bad2-10e12756272c',
	GOOGLE_BIGQUERY = 'bfd1ddf8-ae8a-4620-b1d7-55597d2ba08c',
	AIRTABLE = '14c6e7ea-97ed-4f5e-a7b5-25e9a80b8212',
	NOTION = '6e00b415-b02e-4160-bf02-58176a0ae687',
}

export const pricingMatrix: PricingMatrix = {
	[SubscriptionPlan.FREE]: {
		users: 1,
		orgs: 1,
		teams: 1,
		fileUploads: true,
		dataConnections: false,
		allowedConnectors: [],
		maxFileUploadBytes: (5 * 1024 * 1024), //5MB
		storageLocations: ['US'],
		llmModels: [CredentialType.OPENAI],
		embeddingModels: [CredentialType.OPENAI],
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
			Connectors.NOTION,
		],
		maxFileUploadBytes: (25 * 1024 * 1024), //25MB
		storageLocations: ['US'],
		llmModels: CredentialTypes,
		embeddingModels: CredentialTypes,
	},
	[SubscriptionPlan.TEAMS]: {
		users: 100,
		orgs: 1,
		teams: 1000,
		fileUploads: true,
		dataConnections: true,
		allowedConnectors: [],
		maxFileUploadBytes: (50 * 1024 * 1024), //50MB
		storageLocations: ['US'],
		llmModels: CredentialTypes,
		embeddingModels: CredentialTypes,
	},
	[SubscriptionPlan.ENTERPRISE]: { //TODO
		users: 10**6,
		orgs: 10**6,
		teams: 10**6,
		fileUploads: true,
		dataConnections: true,
		allowedConnectors: [],
		maxFileUploadBytes: (1 * 1024 * 1024 * 1024), //1GB (until we have "custom")
		storageLocations: ['US'],
		llmModels: CredentialTypes,
		embeddingModels: CredentialTypes,
	}
};
