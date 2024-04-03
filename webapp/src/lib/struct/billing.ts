import Permissions from 'permissions/permissions';

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
	maxFileUploadBytes: 'maxFileUploadBytes',
	storageLocations: 'storageLocations',
	llmModels: 'llmModels',
	embeddingModels: 'embeddingModels',
};

// Object to hold the limits for each plan, using computed property names
export type PricingMatrix = {
    [key in SubscriptionPlan]: PlanLimits;
}

export const pricingMatrix: PricingMatrix = {
	[SubscriptionPlan.FREE]: {
		users: 1,
		orgs: 1,
		teams: 1,
		fileUploads: true,
		dataConnections: true,
		maxFileUploadBytes: (5 * 1024 * 1024), //5MB
		storageLocations: ['US'],
		llmModels: [],
		embeddingModels: [],
	},
	[SubscriptionPlan.PRO]: {
		users: 1,
		orgs: 1,
		teams: 1,
		fileUploads: true,
		dataConnections: true,
		maxFileUploadBytes: (25 * 1024 * 1024), //5MB
		storageLocations: ['US'],
		llmModels: [],
		embeddingModels: [],
	},
	[SubscriptionPlan.TEAMS]: {
		users: 5,
		orgs: 1,
		teams: -1,
		fileUploads: true,
		dataConnections: true,
		maxFileUploadBytes: (50 * 1024 * 1024), //5MB
		storageLocations: ['US'],
		llmModels: [],
		embeddingModels: [],
	},
	[SubscriptionPlan.ENTERPRISE]: { //TODO
		users: 'Custom',
		orgs: 'Custom', // Enterprise plans may offer custom configurations for organizations
		teams: 'Custom', // Similarly, the number of teams is customizable for Enterprise plans
		fileUploads: true,
		dataConnections: true,
		maxFileUploadBytes: (1024 * 1024 * 1024), //1GB
		storageLocations: ['US'],
		llmModels: [],
		embeddingModels: [],
	}
};
