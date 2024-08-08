export interface Agent {
	_id: string;
	orgId: string;
	teamId: string;
	name: string;
	role: string;
	goal: string;
	backstory: string;
	modelId: string;
	functionModelId: string | null;
	maxIter: number | null;
	maxRPM: number | null;
	verbose: boolean;
	allowDelegation: boolean;
	toolIds: string[];
	icon: {
		id: string;
		filename: string;
	};
	group: any[];
}
