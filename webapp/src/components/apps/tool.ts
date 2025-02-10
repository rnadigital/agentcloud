import { toolsData } from 'data/apps';
import { create } from 'zustand';

type Tag = {
	name: string;
	textColor: string;
	backgroundColor: string;
};

type Tool = {
	value: string;
	title: string;
	label: string;
	description: string;
	isInstalled: boolean;
	tags: Tag[];
};

type ToolStore = {
	tools: Tool[];
	setTools: (tools: Tool[]) => void;
	addTool: () => void;
};

export const useToolStore = create<ToolStore>(set => ({
	tools: [...toolsData] as Tool[],
	setTools: tools => set({ tools }),
	addTool: () => {}
}));
