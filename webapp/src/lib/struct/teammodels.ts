interface Team {
	_id: string;
	ownerId: string;
	name: string;
	orgId: string;
	members: string[];
	dateCreated: string;
	permissions: Record<string, string>;
	llmModel: Model;
	embeddingModel: Model;
}

interface Model {
	_id: string;
	orgId: string;
	teamId: string;
	name: string;
	model: string;
	embeddingLength: number;
	modelType: string;
	type: string;
	config: {
		model: string;
		api_key: string;
		base_url: string;
		cohere_api_key: string;
		groq_api_key: string;
	};
}

interface Account {
	_id: string;
	name: string;
	email: string;
	orgs: Org[];
	currentOrg: string;
	currentTeam: string;
	stripe: Stripe;
	oauth: Record<string, unknown>;
	permissions: string;
	onboarded: boolean;
	_stripe: Stripe;
}

interface Org {
	id: string;
	name: string;
	ownerId: string;
	teams: TeamSummary[];
	permissions: Record<string, string>;
	stripe?: Stripe;
}

interface TeamSummary {
	id: string;
	name: string;
	ownerId: string;
	permissions: Record<string, string>;
}

interface Stripe {
	stripeCustomerId: string;
	stripePlan: string;
	stripeAddons: {
		users: number;
		storage: number;
	};
	stripeTrial: boolean;
	stripeEndsAt: number;
}

export interface TeamModelResponse {
	data: Team;
	csrf: string;
	account: Account;
}
