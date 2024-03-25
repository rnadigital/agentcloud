import Permissions from 'permissions/permissions';

// Enum for subscription plans
export enum SubscriptionPlan {
    Free = 'Free',
    Pro = 'Pro',
    Teams = 'Teams',
    Enterprise = 'Enterprise'
}

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
	[SubscriptionPlan.Free]: {
		price: '0/mth',
		users: 1,
		orgs: 1,
		teams: 1,
	},
	[SubscriptionPlan.Pro]: {
		price: '99/mth',
		users: 1,
		orgs: 1,
		teams: 1,
	},
	[SubscriptionPlan.Teams]: {
		price: '199/mth',
		users: 5,
		orgs: 1,
		teams: -1,
	},
	[SubscriptionPlan.Enterprise]: { //TODO
		price: 'Custom',
		users: 'Custom',
		orgs: 'Custom', // Enterprise plans may offer custom configurations for organizations
		teams: 'Custom', // Similarly, the number of teams is customizable for Enterprise plans
	}
};
