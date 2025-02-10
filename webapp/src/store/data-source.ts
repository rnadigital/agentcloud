import { dataSourceComboBoxData } from 'data/apps';
import { create } from 'zustand';

type DataSource = {
	value: string;
	label: string;
	title: string;
	type: string;
};

type DataSourcesStore = {
	dataSources: DataSource[];
	setDataSources: (tools: DataSource[]) => void;
	addDataSource: () => void;
};

export const useDataSourcesStore = create<DataSourcesStore>(set => ({
	dataSources: [...dataSourceComboBoxData] as DataSource[],
	setDataSources: dataSources => set({ dataSources }),
	addDataSource: () => {}
}));
