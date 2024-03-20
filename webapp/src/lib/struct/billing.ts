import Permissions from 'permissions/permissions';

// Enum for subscription plans
export enum SubscriptionPlan {
    Free = 'Free',
    Pro = 'Pro',
    Teams = 'Teams',
    Enterprise = 'Enterprise'
}

// Type for the limits of each plan, now with orgs and teams as numbers
export type PlanLimits = {
    price: string; // For real application, consider a more appropriate type for handling currencies
    users: number | 'Custom';
    permissions?: Permissions[] | number[];
    orgs: number | 'Custom'; // Maximum number of organizations
    teams: number | 'Custom'; // Maximum number of teams
    appsYouCanBuild?: string; // Consider a more detailed type than string for structured data
}

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
	[SubscriptionPlan.Enterprise]: {
		price: 'Custom',
		users: 'Custom',
		orgs: 'Custom', // Enterprise plans may offer custom configurations for organizations
		teams: 'Custom', // Similarly, the number of teams is customizable for Enterprise plans
	}
};
