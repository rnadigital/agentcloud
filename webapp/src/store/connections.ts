import * as API from '@api';
import { toast } from 'react-toastify';
import { FieldDescriptionMap, StreamConfigMap } from 'struct/datasource';
import { create } from 'zustand';

import { Datasource, DatasourceScheduleType } from './../lib/struct/datasource';

type Job = {
	jobId: number;
	status: string;
	jobType: string;
	startTime: string;
	connectionId: string;
	lastUpdatedAt: string;
	duration: string;
	bytesSynced: number;
	rowsSynced: number;
};

export interface StreamState {
	checkedChildren: string[];
	primaryKey: string[];
	syncMode: string;
	cursorField: string[];
	descriptionsMap: FieldDescriptionMap;
}

interface ConnectionsStore {
	datasource: Datasource;
	airbyteState: any;
	jobsList: Job[];
	submitting: Record<string, boolean>;
	resourceSlug: string;
	datasourceId: string;
	csrf: string;
	scheduleType?: DatasourceScheduleType;
	cronExpression?: string;
	timeUnit?: string;
	units?: number;
	syncing: any;
	setStore: (data: Partial<ConnectionsStore>) => void;
	fetchDatasource: (router: any) => Promise<void>;
	fetchJobsList: (router: any) => Promise<void>;
	fetchSchema: (router: any) => Promise<void>;
	schemaDiscoveredState: any;
	streamState: StreamConfigMap;
	updateStreams: (router: any, sync?: boolean) => Promise<void>;
	updateSchedule: (params: {
		scheduleType: string;
		timeUnit?: string;
		cronExpression?: string;
		router: any;
	}) => Promise<void>;
	syncDatasource: (datasourceId: string, router: any) => Promise<void>;
	setStreamState: (streamState: Record<string, StreamState>) => void;
}

export const useConnectionsStore = create<ConnectionsStore>((set, get) => ({
	datasource: null,
	airbyteState: null,
	jobsList: null,
	submitting: {},
	syncing: {},
	resourceSlug: '',
	datasourceId: '',
	csrf: '',
	schemaDiscoveredState: null,
	streamState: {},
	scheduleType: DatasourceScheduleType.MANUAL,
	cronExpression: '0 0 * * *',
	timeUnit: 'day',
	units: 0,

	setStreamState: newState =>
		set(state => ({
			...state,
			streamState: {
				...state.streamState,
				...newState
			}
		})),
	setStore: data => set(state => ({ ...state, ...data })),

	fetchDatasource: async router => {
		const { resourceSlug, datasourceId } = get();
		if (!resourceSlug || !datasourceId) return;

		try {
			const res = await API.getDatasource(
				{ resourceSlug, datasourceId },
				response => {
					if (JSON.stringify(get().datasource) !== JSON.stringify(response?.datasource)) {
						set(state => ({
							...state,
							datasource: response?.datasource,
							streamState: response?.datasource?.streamConfig,
							scheduleType: response?.datasource?.scheduleType,
							cronExpression: response?.datasource?.cronExpression,
							timeUnit: response?.datasource?.timeUnit
						}));
					}
				},
				error => {
					toast.error(error);
				},
				router
			);

			const airbyteState = await API.checkAirbyteConnection(
				{ resourceSlug },
				response => {
					if (JSON.stringify(get().airbyteState) !== JSON.stringify(response)) {
						set(state => ({
							...state,
							airbyteState: response
						}));
					}
				},
				error => {
					toast.error(error);
				},
				router
			);
		} catch (error) {
			console.error('Error fetching datasource:', error);
		}
	},

	fetchJobsList: async router => {
		const { resourceSlug, datasourceId } = get();
		if (!resourceSlug || !datasourceId) return;

		try {
			await API.getJobsList(
				{ resourceSlug, datasourceId },
				response => {
					if (JSON.stringify(get().jobsList) !== JSON.stringify(response)) {
						set(state => ({
							...state,
							jobsList: response.jobs
						}));
					}
				},
				error => {
					toast.error(error);
				},
				router
			);
		} catch (error) {
			console.error('Error fetching jobs list:', error);
		}
	},
	deleteDatasource: async (router, datasourceId) => {
		const { resourceSlug, csrf } = get();

		set(state => ({
			...state,
			submitting: { ...state.submitting, deleteDatasource: true }
		}));

		try {
			await API.deleteDatasource(
				{
					_csrf: csrf,
					resourceSlug,
					datasourceId
				},
				() => {
					toast.success('Deleted datasource');
					router.push(`/${resourceSlug}/datasources`);
				},
				() => {
					toast.error('Error deleting datasource');
				},
				router
			);
		} finally {
			set(state => ({
				...state,
				submitting: { ...state.submitting, deleteDatasource: false }
			}));
		}
	},
	fetchSchema: async router => {
		const { resourceSlug, datasourceId } = get();
		if (!resourceSlug || !datasourceId) return;

		try {
			set(state => ({
				...state,
				submitting: { ...state.submitting, fetchSchema: true }
			}));

			await API.getDatasourceSchema(
				{ resourceSlug, datasourceId },
				response => {
					if (JSON.stringify(get().schemaDiscoveredState) !== JSON.stringify(response)) {
						set(state => ({
							...state,
							schemaDiscoveredState: response
						}));
					}
				},
				error => {
					toast.error(error);
				},
				router
			);
		} catch (error) {
			console.error('Error fetching schema:', error);
		} finally {
			set(state => ({
				...state,
				submitting: { ...state.submitting, fetchSchema: false }
			}));
		}
	},
	updateStreams: async (router, sync?: boolean) => {
		const { resourceSlug, datasourceId, csrf, streamState, fetchSchema, fetchDatasource } = get();

		set(state => ({
			...state,
			submitting: { ...state.submitting, [`updateStreams${sync ? 'sync' : ''}`]: true }
		}));

		try {
			// Note: filtering to streams for which we have at least 1 checked child
			const filteredStreamState = Object.fromEntries(
				Object.entries(streamState || {}).filter(
					([_, config]: [string, any]) => config.checkedChildren.length > 0
				)
			);

			const body = {
				_csrf: csrf,
				resourceSlug,
				datasourceId,
				sync,
				streamConfig: filteredStreamState
			};

			await API.updateDatasourceStreams(
				body,
				() => {
					toast.success(`Updated streams${sync ? ' and triggered sync job' : ''}`);
					set(state => ({
						...state,
						schemaDiscoveredState: null
					}));
					fetchSchema(router);
					fetchDatasource(router);
				},
				error => {
					toast.error(error);
				},
				router
			);
		} finally {
			set(state => ({
				...state,
				submitting: { ...state.submitting, [`updateStreams${sync ? 'sync' : ''}`]: false }
			}));
		}
	},
	updateSchedule: async ({ scheduleType, timeUnit, cronExpression, router }) => {
		const { resourceSlug, datasourceId, csrf, fetchDatasource } = get();

		set(state => ({
			...state,
			submitting: { ...state.submitting, editSchedule: true }
		}));

		try {
			await API.updateDatasourceSchedule(
				{
					_csrf: csrf,
					resourceSlug,
					datasourceId,
					scheduleType,
					timeUnit,
					cronExpression
				},
				() => {
					toast.success('Edited datasource schedule');
					fetchDatasource(router);
				},
				error => {
					toast.error(error);
				},
				router
			);
		} finally {
			set(state => ({
				...state,
				submitting: { ...state.submitting, editSchedule: false }
			}));
		}
	},
	syncDatasource: async (datasourceId: string, router) => {
		const { resourceSlug, csrf, fetchDatasource } = get();

		set(state => ({
			...state,
			syncing: { ...state.syncing, [datasourceId]: true }
		}));

		try {
			await API.syncDatasource(
				{
					_csrf: csrf,
					resourceSlug,
					datasourceId
				},
				() => {
					fetchDatasource(router);
				},
				error => {
					toast.error('Error syncing');
				},
				router
			);
		} finally {
			set(state => ({
				...state,
				syncing: { ...state.syncing, [datasourceId]: false }
			}));
		}
	}
}));
