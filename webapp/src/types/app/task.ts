export interface Task {
	_id: string;
	orgId: string;
	teamId: string;
	name: string;
	description: string;
	expectedOutput: string;
	toolIds: string[];
	agentId: string;
	context: string[];
	asyncExecution: boolean;
	requiresHumanInput: boolean;
	icon: {
		id: string;
		filename: string;
	} | null;
}
