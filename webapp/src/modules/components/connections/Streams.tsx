import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import { StreamsList } from 'components/DatasourceStream';
import Spinner from 'components/Spinner';
import { useEffect, useReducer, useState } from 'react';
import submittingReducer from 'utils/submittingreducer';

import { useConnections } from './ConnectionsContext';

export function Streams() {
	const { datasource, airbyteState, submitting, resourceSlug, datasourceId, csrf } =
		useConnections();
	const a = useConnections();
	console.log('a');
	console.log(a);
	const [streamState, setStreamReducer] = useReducer(submittingReducer, {});
	const [schemaDiscoverState, setSchemaDiscoverState] = useState(null);
	const { streamProperties, discoveredSchema } = schemaDiscoverState || {};

	async function updateStreams(e, sync?: boolean) {
		// ... move updateStreams logic from ConnectionsItem ...
	}

	async function fetchSchema() {
		// ... move fetchSchema logic from ConnectionsItem ...
	}

	useEffect(() => {
		setTimeout(() => {
			fetchSchema();
		}, 1500);
	}, []);

	if (!discoveredSchema) {
		return <Spinner />;
	}

	return (
		<form onSubmit={e => e.preventDefault()}>
			<StreamsList
				streams={discoveredSchema.catalog.streams}
				streamProperties={streamProperties}
				setStreamReducer={setStreamReducer}
				streamState={datasource.streamConfig}
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
