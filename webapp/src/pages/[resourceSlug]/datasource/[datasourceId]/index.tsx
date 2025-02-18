'use strict';

import * as API from '@api';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import CreateDatasourceForm from 'components/CreateDatasourceForm';
import { StreamsList } from 'components/DatasourceStream';
import DatasourceTabs from 'components/DatasourceTabs';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { convertQuartzToCron } from 'lib/airbyte/cronconverter';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import {
	DatasourceScheduleType,
	DatasourceStatus,
	StreamConfig,
	StreamConfigMap
} from 'struct/datasource';
import submittingReducer from 'utils/submittingreducer';
// @ts-ignore
const DatasourceScheduleForm = dynamic(() => import('components/DatasourceScheduleForm'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false
});

export default function Datasource(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
	const router = useRouter();
	const { resourceSlug, datasourceId } = router.query;
	const [state, dispatch] = useState(props);
	const [airbyteState, setAirbyteState] = useState(null);
	const [jobsList, setJobsList] = useState(null);
	const [tab, setTab] = useState(0);
	const [schemaDiscoverState, setSchemaDiscoverState] = useState(null);
	const { streamProperties, discoveredSchema } = schemaDiscoverState || {};
	const [submitting, setSubmitting] = useReducer(submittingReducer, {});
	const [editingSchedule, setEditingSchedule] = useState(false);
	const [error, setError] = useState();
	const { datasource } = state;
	const [scheduleType, setScheduleType] = useState(DatasourceScheduleType.MANUAL);
	const [timeUnit, setTimeUnit] = useState('day');
	const [units, setUnits] = useState(0);
	const [cronExpression, setCronExpression] = useState('0 0 * * *');
	const isDraft = datasource?.status === DatasourceStatus.DRAFT;
	const numStreams = datasource?.connectionSettings?.configurations?.streams?.length || 0;
	const [streamState, setStreamReducer]: [StreamConfigMap, Function] = useReducer(
		submittingReducer,
		{}
	);

	useEffect(() => {
		setTimeout(() => {
			fetchSchema();
		}, 1500);
	}, []);

	async function fetchDatasource() {
		await API.getDatasource(
			{
				resourceSlug,
				datasourceId
			},
			res => {
				const datasource = res?.datasource;
				if (datasource) {
					const { scheduleType, cronExpression } = datasource?.connectionSettings?.schedule || {};
					setScheduleType(scheduleType);
					cronExpression && setCronExpression(convertQuartzToCron(cronExpression));
					datasource?.timeUnit && setTimeUnit(datasource.timeUnit);
				}
				dispatch(res);
			},
			setError,
			router
		);
		await API.checkAirbyteConnection({ resourceSlug }, setAirbyteState, setError, router);
	}

	async function fetchJobsList() {
		await API.getJobsList(
			{
				resourceSlug,
				datasourceId
			},
			setJobsList,
			setError,
			router
		);
	}

	async function fetchSchema() {
		setSubmitting({ fetchSchema: true });
		try {
			await API.getDatasourceSchema(
				{
					resourceSlug,
					datasourceId
				},
				setSchemaDiscoverState,
				setError,
				router
			);
		} finally {
			setSubmitting({ fetchSchema: false });
		}
	}

	async function deleteDatasource(datasourceId) {
		setSubmitting({ deleteDatasource: true });
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
			setSubmitting({ deleteDatasource: false });
		}
	}

	async function updateStreams(e, sync?: boolean) {
		setSubmitting({ [`updateStreams${sync ? 'sync' : ''}`]: true });
		try {
			//Note: filtering to streams for which we have at least 1 checked child
			const filteredStreamState = Object.fromEntries(
				Object.entries(streamState).filter(
					(e: [string, StreamConfig]) => e[1].checkedChildren.length > 0
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
					setSchemaDiscoverState(null);
					fetchSchema();
					fetchDatasource();
				},
				res => {
					toast.error(res);
				},
				router
			);
		} finally {
			setSubmitting({ [`updateStreams${sync ? 'sync' : ''}`]: false });
		}
	}

	async function updateSchedule(e) {
		setSubmitting({ editSchedule: true });
		try {
			const body = {
				_csrf: csrf,
				resourceSlug,
				datasourceId,
				scheduleType,
				timeUnit,
				cronExpression
			};
			await API.updateDatasourceSchedule(
				body,
				() => {
					toast.success('Edited datasource schedule');
					fetchDatasource();
				},
				res => {
					toast.error(res);
				},
				router
			);
		} finally {
			setSubmitting({ editSchedule: false });
		}
	}

	useEffect(() => {
		fetchDatasource();
		fetchJobsList();
	}, [resourceSlug]);

	useEffect(() => {
		const matches = location?.hash.match(/tab-(\d+)/);
		if (matches && matches.length > 0) {
			setTab(parseInt(matches[1]));
		}
	}, []);

	if (!datasource) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Manage Datasource - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2 flex justify-between'>
				<h3 className='pl-2 font-semibold text-gray-900'>
					Manage Datasource - {datasource?.originalName}
				</h3>
				<button
					onClick={() => deleteDatasource(datasource._id)}
					className='inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
					disabled={submitting['deleteDatasource']}>
					{submitting['deleteDatasource'] ? (
						<ButtonSpinner />
					) : (
						<TrashIcon className='h-5 w-5 pe-1' aria-hidden='true' />
					)}
					Delete Datasource
				</button>
			</div>

			<DatasourceTabs callback={setTab} current={tab} datasource={datasource} />

			{/*TODO: component that takes discoveredSchema and datasource*/}
			{tab === 0 && (
				<>
					{discoveredSchema ? (
						<form
							onSubmit={e => {
								e.preventDefault();
							}}>
							<StreamsList
								streams={discoveredSchema.catalog.streams}
								streamProperties={streamProperties}
								// setStreamReducer={setStreamReducer as any}
								streamState={datasource.streamConfig}
							/>
							<button
								onClick={e => updateStreams(e)}
								disabled={submitting['updateStreams'] || submitting['updateStreamssync']}
								type='submit'
								className='me-4 rounded-md disabled:bg-slate-400 bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'>
								{submitting['updateStreams'] && <ButtonSpinner />}
								{submitting['updateStreams'] ? 'Saving...' : 'Save'}
							</button>
							<button
								onClick={e => updateStreams(e, true)}
								disabled={
									submitting['updateStreamssync'] ||
									submitting['updateStreams'] ||
									!airbyteState?.isEnabled
								}
								type='submit'
								className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>
								{submitting['updateStreamssync'] && <ButtonSpinner />}
								{submitting['updateStreamssync'] ? 'Saving...' : 'Save and Sync'}
							</button>
						</form>
					) : (
						<Spinner />
					)}
				</>
			)}

			{/*TODO: component that takes jobList*/}
			{tab === 1 && (
				<>
					<div className='rounded-lg overflow-hidden shadow mt-4'>
						<table className='min-w-full divide-y divide-gray-200'>
							<thead className='bg-gray-50 dark:bg-slate-800 dark:text-white text-gray-500'>
								<tr>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
										Job ID
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
										Status
									</th>
									{/*<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Job Type</th>*/}
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
										Connection ID
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
										Start Time
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
										Last Updated
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
										Duration
									</th>
								</tr>
							</thead>
							<tbody className='bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:text-gray-50 text-gray-500 text-sm'>
								{jobsList?.jobs?.map(job => (
									<tr key={job.jobId}>
										<td className='px-6 py-4 whitespace-nowrap'>{job.jobId}</td>
										<td className='px-6 py-4 whitespace-nowrap'>{job.status}</td>
										{/*<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{job.jobType}</td>*/}
										<td className='px-6 py-4 whitespace-nowrap'>{job.connectionId}</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											{new Date(job.startTime).toLocaleString()}
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											{new Date(job.lastUpdatedAt).toLocaleString()}
										</td>
										<td className='px-6 py-4 whitespace-nowrap lowercase'>
											{job.duration.substr(2)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}

			{tab === 2 && datasource.sourceType !== 'file' && (
				<div>
					<DatasourceScheduleForm
						scheduleType={scheduleType}
						setScheduleType={setScheduleType}
						timeUnit={timeUnit}
						setTimeUnit={setTimeUnit}
						units={units}
						setUnits={setUnits}
						cronExpression={cronExpression}
						setCronExpression={setCronExpression}
					/>
					<div className='flex space-x-2'>
						<button
							onClick={async e => {
								await updateSchedule(e);
								setEditingSchedule(false);
							}}
							disabled={submitting['updateStreams']}
							type='submit'
							className={
								'flex rounded-md bg-indigo-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-200'
							}>
							Save
						</button>
						{editingSchedule && (
							<button
								onClick={e => {
									setEditingSchedule(false);
								}}
								type='submit'
								className={
									'flex rounded-md disabled:bg-slate-400 bg-gray-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
								}>
								Cancel
							</button>
						)}
					</div>
				</div>
			)}

			{/*tab === 3 && <div className='space-y-3'>
			Visualisation
		</div>*/}

			{/*tab === 4 && <div className='space-y-3'>
			Settings
		</div>*/}
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
