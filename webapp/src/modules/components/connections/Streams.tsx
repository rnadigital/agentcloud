import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import { StreamsList } from 'components/DatasourceStream';
import Spinner from 'components/Spinner';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useReducer, useState } from 'react';
import { useConnectionsStore } from 'store/connections';
import submittingReducer from 'utils/submittingreducer';
import { useShallow } from 'zustand/react/shallow';

export function Streams() {
	const router = useRouter();

	const connectionsStore = useConnectionsStore(
		useShallow(state => ({
			datasource: state.datasource,
			submitting: state.submitting,
			airbyteState: state.airbyteState,
			schemaDiscoveredState: state.schemaDiscoveredState,
			updateStreams: state.updateStreams,
			fetchSchema: state.fetchSchema,
			streamState: state.streamState
		}))
	);

	const {
		datasource,
		submitting,
		airbyteState,
		schemaDiscoveredState,
		fetchSchema,
		updateStreams,
		streamState
	} = connectionsStore;

	const { streamProperties, discoveredSchema } = schemaDiscoveredState || {};

	useEffect(() => {
		setTimeout(() => {
			fetchSchema(router);
		}, 1500);
	}, []);

	if (!discoveredSchema) {
		return (
			<div className='flex justify-center items-center h-full'>
				<Loader className='animate-spin' size={32} />
			</div>
		);
	}

	return (
		<form onSubmit={e => e.preventDefault()}>
			<StreamsList
				streams={discoveredSchema.catalog.streams}
				streamProperties={streamProperties}
				streamState={streamState}
			/>
			<button
				onClick={e => updateStreams(e)}
				disabled={submitting['updateStreams'] || submitting['updateStreamssync']}
				type='submit'
				className='me-4 rounded-md disabled:bg-slate-400 bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
			>
				{submitting['updateStreams'] && <ButtonSpinner />}
				{submitting['updateStreams'] ? 'Saving...' : 'Save'}
			</button>
			<button
				onClick={e => updateStreams(e, true)}
				disabled={
					submitting['updateStreamssync'] || submitting['updateStreams'] || !airbyteState?.isEnabled
				}
				type='submit'
				className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				{submitting['updateStreamssync'] && <ButtonSpinner />}
				{submitting['updateStreamssync'] ? 'Saving...' : 'Save and Sync'}
			</button>
		</form>
	);
}
