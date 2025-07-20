import { connectionsData } from 'data/connections';
import { create } from 'zustand';

type Job = {
	id: number;
	status: string;
	duration: string;
	last_updated: string;
};

type Connection = {
	id: number;
	name: string;
	status: string;
	created_at: string;
	source: string;
	destination: string;
	sync: string;
	jobs: Job[];
};

type ConnectionsStore = {
	connections: Connection[];
	setConnections: (connections: Connection[]) => void;
	addConnection: (connection: Connection) => void;
};

export const useConnectionsStore = create<ConnectionsStore>(set => ({
	connections: [...connectionsData] as Connection[],
	setConnections: connections => set({ connections }),
	addConnection: () => {}
}));
