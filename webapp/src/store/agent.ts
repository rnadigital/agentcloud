import { agentsData } from 'data/apps';
import { create } from 'zustand';

type User = {
	id: number;
	name: string;
};

type Agent = {
	id: number;
	name: string;
	label: string;
	role: string;
	dataSource: string;
	tool: string;
	users: User[];
};

type AgentStore = {
	agents: Agent[];
	setAgents: (agents: Agent[]) => void;
	addAgent: (agent: Agent) => void;
};

export const useAgentStore = create<AgentStore>(set => ({
	agents: [...agentsData] as Agent[],
	// agents: [] as Agent[],
	setAgents: (agents: Agent[]) => set({ agents }),
	addAgent: (agent: Agent) =>
		set(state => ({
			agents: [...state.agents, agent]
		}))
}));
