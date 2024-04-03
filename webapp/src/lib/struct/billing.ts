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
	price: string;
	users: number | 'Custom';
	permissions?: Permissions[] | number[];
	orgs: number | 'Custom';
	teams: number | 'Custom';
	appsYouCanBuild?: string;
};

// This utility type extracts the keys from PlanLimits and maps them to the same value as the key
type PlanLimitsKeysType = {
	[K in keyof PlanLimits]: K;
};

// Create a const object with keys that match the PlanLimits type
export const PlanLimitsKeys: PlanLimitsKeysType = {
	price: 'price',
	users: 'users',
	permissions: 'permissions',
	orgs: 'orgs',
	teams: 'teams',
	appsYouCanBuild: 'appsYouCanBuild',
};

// Object to hold the limits for each plan, using computed property names
export type PricingMatrix = {
    [key in SubscriptionPlan]: PlanLimits;
}

export const pricingMatrix: PricingMatrix = {
	[SubscriptionPlan.FREE]: {
		price: '0/mth',
		users: 1,
		orgs: 1,
		teams: 1,
	},
	[SubscriptionPlan.PRO]: {
		price: '99/mth',
		users: 1,
		orgs: 1,
		teams: 1,
	},
	[SubscriptionPlan.TEAMS]: {
		price: '199/mth',
		users: 5,
		orgs: 1,
		teams: -1,
	},
	[SubscriptionPlan.ENTERPRISE]: { //TODO
		price: 'Custom',
		users: 'Custom',
		orgs: 'Custom', // Enterprise plans may offer custom configurations for organizations
		teams: 'Custom', // Similarly, the number of teams is customizable for Enterprise plans
	}
};
