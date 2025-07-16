import * as API from '@api';
import { defaultChunkingOptions } from 'misc/defaultchunkingoptions';
import { toast } from 'react-toastify';
import { Connector } from 'struct/connector';
import { StreamConfigMap } from 'struct/datasource';
import { create } from 'zustand';

import { StreamState } from './connections';
import { ModelsJsonData } from 'controllers/model';
import { VectorDb, VectorDbDocument } from 'struct/vectordb';

interface DatasourceStore {
	// State
	connectors: Connector[];
	searchInput: string;
	currentStep: number;
	currentDatasourceStep: number;
	chunkingConfig: Record<string, any>;
	submitting: boolean;
	error: string | null;
	resourceSlug: string;
	csrf: string;
	spec: any;
	loading: boolean;
	stagedDatasource?: any;
	streamState: StreamConfigMap;
	embeddingField: string;
	teamModels: ModelsJsonData['models'];
	vectorDbs: VectorDbDocument[];
	// Form persistence
	formData: Record<string, any>;
	oneOfSelections: Record<string, any>;
	// Connector selection
	selectedConnector?: Connector;
	// Stream configuration persistence
	streamConfigData: Record<string, any>;
	// Actions
	setStore: (data: Partial<DatasourceStore>) => void;
	initConnectors: (router: any) => Promise<void>;
	setSearchInput: (input: string) => void;
	setCurrentStep: (step: number) => void;
	setCurrentDatasourceStep: (step: number) => void;
	setStreamState: (streamState: Record<string, StreamState>) => void;
	setChunkingConfig: (config: Record<string, any>) => void;
	getSpecification: (sourceDefinitionId: string, posthog: any) => Promise<void>;
	datasourcePost: (
		data: any,
		connector: Connector,
		datasourceName: string,
		datasourceDescription: string,
		posthog: any,
		router: any
	) => Promise<void>;
	fetchTeamModels: (router: any) => Promise<void>;
	fetchVectorDbs: (router: any) => Promise<void>;
	// Form persistence actions
	saveFormData: (formId: string, data: any) => void;
	loadFormData: (formId: string) => any;
	clearFormData: (formId?: string) => void;
	saveOneOfSelection: (fieldName: string, selection: any) => void;
	loadOneOfSelection: (fieldName: string) => any;
	clearOneOfSelection: (fieldName?: string) => void;
	// Enhanced form persistence methods
	restoreFormData: (formId: string, methods: any) => boolean;
	hasSavedData: (formId: string) => boolean;
	// Connector selection actions
	setSelectedConnector: (connector?: Connector) => void;
	clearSelectedConnector: () => void;
	// Stream configuration persistence actions
	saveStreamConfig: (streamName: string, config: any) => void;
	loadStreamConfig: (streamName: string) => any;
	clearStreamConfig: (streamName?: string) => void;
	clearAllStreamConfig: () => void;
}

export const useDatasourceStore = create<DatasourceStore>((set, get) => ({
	// Initial state
	connectors: [],
	searchInput: '',
	currentStep: 0,
	currentDatasourceStep: 0,
	streamState: {},
	chunkingConfig: defaultChunkingOptions,
	submitting: false,
	error: null,
	resourceSlug: '',
	csrf: '',
	spec: null,
	loading: false,
	embeddingField: '',
	teamModels: [],
	vectorDbs: [],
	// Form persistence
	formData: {},
	oneOfSelections: {},
	// Connector selection
	selectedConnector: undefined,
	// Stream configuration persistence
	streamConfigData: {},
	// Actions
	setStore: data => set(state => ({ ...state, ...data })),

	initConnectors: async router => {
		const { resourceSlug } = get();

		try {
			await API.getConnectors(
				{ resourceSlug },
				async res => {
					const connectorsJson = res?.sourceDefinitions;
					if (!connectorsJson?.length) {
						throw new Error('Failed to fetch connector list, please ensure Airbyte is running.');
					}
					set(state => ({
						...state,
						connectors: connectorsJson,
						selectedConnector: undefined,
						streamConfigData: {}
					}));
				},
				err => {
					set(state => ({
						...state,
						error: 'Failed to fetch connector list, please ensure Airbyte is running.'
					}));
				},
				router
			);
		} catch (e) {
			console.error(e);
			set(state => ({ ...state, error: e?.message || String(e) }));
		}
	},

	setSearchInput: input => set(state => ({ ...state, searchInput: input })),

	setCurrentStep: step => set(state => ({ ...state, currentStep: step })),

	setCurrentDatasourceStep: step => set(state => ({ ...state, currentDatasourceStep: step })),

	setStreamState: newState =>
		set(state => ({
			...state,
			streamState: {
				...state.streamState,
				...newState
			}
		})),
	setChunkingConfig: config =>
		set(prev => ({ ...prev, chunkingConfig: { ...prev.chunkingConfig, ...config } })),

	getSpecification: async (sourceDefinitionId, posthog) => {
		set({ loading: true, error: null });
		const { resourceSlug } = get();

		await API.getSpecification(
			{ sourceDefinitionId, resourceSlug },
			spec => {
				posthog.capture('getSpecification', { sourceDefinitionId });
				set({ spec, loading: false });
			},
			error => {
				posthog.capture('getSpecification', { sourceDefinitionId, error });
				set({ error, loading: false });
			},
			null
		);
	},

	datasourcePost: async (
		data,
		connector,
		datasourceName,
		datasourceDescription,
		posthog,
		router
	) => {
		set({ submitting: true, error: null });
		const { csrf, resourceSlug } = get();
		const posthogEvent = 'testDatasource';

		try {
			const body = {
				sourceConfig: data,
				_csrf: csrf,
				connectorId: connector.sourceDefinitionId,
				connectorName: connector.name,
				resourceSlug,
				datasourceName,
				datasourceDescription
			};

			await API.testDatasource(
				body,
				stagedDatasource => {
					posthog.capture(posthogEvent, {
						datasourceName,
						connectorId: connector?.sourceDefinitionId,
						connectorName: connector?.name
					});
					if (stagedDatasource) {
						set(state => ({ ...state, currentDatasourceStep: 1, stagedDatasource }));
					} else {
						set({ error: 'Datasource connection test failed.' });
					}
				},
				error => {
					posthog.capture(posthogEvent, {
						datasourceName,
						connectorId: connector?.sourceDefinitionId,
						connectorName: connector?.name,
						error
					});
					set({ error });
				},
				router
			);
		} catch (e) {
			posthog.capture(posthogEvent, {
				datasourceName,
				connectorId: connector?.sourceDefinitionId,
				connectorName: connector?.name,
				error: e?.message || e
			});
			console.error(e);
			set({ error: e?.message || String(e) });
		} finally {
			await new Promise(res => setTimeout(res, 750));
			set({ submitting: false });
		}
	},

	fetchTeamModels: async router => {
		const { csrf, resourceSlug } = get();

		await API.getModels(
			{ resourceSlug },
			({ models }) => set(state => ({ ...state, teamModels: models })),
			toast.error,
			router
		);
	},
	fetchVectorDbs: async router => {
		const { csrf, resourceSlug } = get();

		await API.getVectorDbs(
			{ resourceSlug },
			({ vectorDbs }) => set(state => ({ ...state, vectorDbs })),
			toast.error,
			router
		);
	},

	// Form persistence actions
	saveFormData: (formId, data) => {
		set(state => ({
			...state,
			formData: {
				...state.formData,
				[formId]: data
			}
		}));
	},

	loadFormData: formId => {
		const { formData } = get();
		return formData[formId] || null;
	},

	clearFormData: formId => {
		if (formId) {
			set(state => {
				const newFormData = { ...state.formData };
				delete newFormData[formId];
				return { ...state, formData: newFormData };
			});
		} else {
			set(state => ({ ...state, formData: {} }));
		}
	},

	saveOneOfSelection: (fieldName, selection) => {
		set(state => ({
			...state,
			oneOfSelections: {
				...state.oneOfSelections,
				[fieldName]: selection
			}
		}));
	},

	loadOneOfSelection: fieldName => {
		const { oneOfSelections } = get();
		return oneOfSelections[fieldName] || null;
	},

	clearOneOfSelection: fieldName => {
		if (fieldName) {
			set(state => {
				const newOneOfSelections = { ...state.oneOfSelections };
				delete newOneOfSelections[fieldName];
				return { ...state, oneOfSelections: newOneOfSelections };
			});
		} else {
			set(state => ({ ...state, oneOfSelections: {} }));
		}
	},

	clearAllFormData: () => {
		set(state => ({
			...state,
			formData: {},
			oneOfSelections: {},
			streamConfigData: {}
		}));
	},

	// Enhanced form persistence methods
	restoreFormData: (formId, methods) => {
		const savedData = get().loadFormData(formId);
		if (savedData && methods && Object.keys(savedData).length > 0) {
			try {
				methods.reset(savedData);
				return true;
			} catch (error) {
				console.warn('Failed to restore form data:', error);
				return false;
			}
		}
		return false;
	},

	hasSavedData: formId => {
		const savedData = get().loadFormData(formId);
		return savedData !== null && Object.keys(savedData).length > 0;
	},

	// Connector selection actions
	setSelectedConnector: (connector?: Connector) => {
		set(state => ({ ...state, selectedConnector: connector }));
	},
	clearSelectedConnector: () => {
		set(state => ({ ...state, selectedConnector: undefined }));
	},

	// Stream configuration persistence actions
	saveStreamConfig: (streamName, config) => {
		console.log(`[Store] Saving stream config for ${streamName}:`, config);
		set(state => ({
			...state,
			streamConfigData: {
				...state.streamConfigData,
				[streamName]: config
			}
		}));
	},
	loadStreamConfig: streamName => {
		const { streamConfigData } = get();
		const config = streamConfigData[streamName] || null;
		console.log(`[Store] Loading stream config for ${streamName}:`, config);
		return config;
	},
	clearStreamConfig: streamName => {
		if (streamName) {
			set(state => {
				const newStreamConfigData = { ...state.streamConfigData };
				delete newStreamConfigData[streamName];
				return { ...state, streamConfigData: newStreamConfigData };
			});
		} else {
			set(state => ({ ...state, streamConfigData: {} }));
		}
	},
	clearAllStreamConfig: () => {
		console.log(`[Store] Clearing all stream config data`);
		set(state => ({ ...state, streamConfigData: {} }));
	}
}));
