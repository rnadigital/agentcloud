'use strict';

import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import CreateDatasourceForm from 'components/CreateDatasourceForm';
import { StreamsList } from 'components/DatasourceStream';
import DatasourceTabs from 'components/DatasourceTabs';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Datasource(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, datasourceId } = router.query;
	const [state, dispatch] = useState(props);
	const [jobsList, setJobsList] = useState([]);
	const [tab, setTab] = useState(0);
	const [discoveredSchema, setDiscoveredSchema] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState();
	const { datasource } = state;

	async function fetchDatasource() {
		await API.getDatasource({
			resourceSlug,
			datasourceId,
		}, dispatch, setError, router);
	}

	async function fetchJobsList() {
		await API.getJobsList({
			resourceSlug,
			datasourceId,
		}, setJobsList, setError, router);
	}

	async function fetchSchema() {
		setSubmitting(true);
		try {
			await API.getDatasourceSchema({
				resourceSlug,
				datasourceId,
			}, setDiscoveredSchema, setError, router);
		} finally {
			setSubmitting(false);
		}
	}

	async function updateStreams(e, sync: boolean) {
		setSubmitting(true);
		try {
			const streams = Array.from(e.target.form.elements)
				.filter(x => x['checked'] === true)
				.map(x => x['name']);
			const body = {
				_csrf: csrf,
				resourceSlug,
				datasourceId,
				streams,
				sync,
			};
			await API.updateDatasourceStreams(body, () => {
				toast.success(`Updated streams${sync ? ' and triggered sync job' : ''}`);
				setDiscoveredSchema(null);
				fetchDatasource();
			}, (res) => {
				toast.error(res);
			}, router);
		} finally {
			setSubmitting(false);
		}
	}

	useEffect(() => {
		fetchDatasource();
		fetchJobsList();
	}, [resourceSlug]);
	
	if (datasource == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Manage Datasource - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Manage Datasource</h3>
		</div>

		<DatasourceTabs callback={setTab} current={tab} />

		{tab === 0 && <>
		
			{discoveredSchema && <form onSubmit={(e) => { e.preventDefault(); }}>
				<StreamsList
					streams={discoveredSchema.discoveredSchema.catalog.streams}
					existingStreams={datasource.connectionSettings.configurations.streams.map(x => x.name)}
				/>
				<button
					onClick={(e) => updateStreams(e)}
					disabled={submitting}
					type='submit'
					className='me-4 rounded-md disabled:bg-slate-400 bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
				>
					{submitting && <ButtonSpinner />}
					{submitting ? 'Saving...' : 'Save'}
				</button>
				<button
					onClick={(e) => updateStreams(e, true)}
					disabled={submitting}
					type='submit'
					className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					{submitting && <ButtonSpinner />}
					{submitting ? 'Saving...' : 'Save and Sync'}
				</button>
			</form>}

			{!discoveredSchema && <>
				<StreamsList
					streams={datasource.connectionSettings.configurations.streams}
					existingStreamsw={datasource.connectionSettings.configurations.streams.map(x => x.name)}
					readonly={true}
				/>
				<span>
					<button
						disabled={submitting}
						onClick={() => fetchSchema()}
						className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						{submitting && <ButtonSpinner />}
						{submitting ? 'Fetching Streams...' : 'Edit Streams'}
					</button>
				</span>
			</>}

		</>}

		{tab === 1 && <>
			<div className='rounded-lg overflow-hidden shadow-lg mt-4'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Job ID</th>
							<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
							{/*<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Job Type</th>*/}
							<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Connection ID</th>
							<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Start Time</th>
							<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Last Updated</th>
							<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Duration</th>
							<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Rows Synced</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200'>
						{jobsList?.jobs?.map((job) => (
							<tr key={job.jobId}>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{job.jobId}</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{job.status}</td>
								{/*<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{job.jobType}</td>*/}
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{job.connectionId}</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{new Date(job.startTime).toLocaleString()}</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{new Date(job.lastUpdatedAt).toLocaleString()}</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 lowercase'>{job.duration.substr(2)}</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{job.rowsSynced}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>}

		{tab === 2 && 'TODO'}

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
