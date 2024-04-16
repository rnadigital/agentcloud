'use strict';

import * as API from '@api';
import {
	ExclamationTriangleIcon,
	TrashIcon,
} from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import CreateDatasourceForm from 'components/CreateDatasourceForm';
import { StreamsList } from 'components/DatasourceStream';
import DatasourceTabs from 'components/DatasourceTabs';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { DatasourceStatus } from 'struct/datasource';
import { DatasourceScheduleType } from 'struct/schedule';
import submittingReducer from 'utils/submittingreducer';
// @ts-ignore
const DatasourceScheduleForm = dynamic(() => import('components/DatasourceScheduleForm'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});

export default function Datasource(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, datasourceId } = router.query;
	const [state, dispatch] = useState(props);
	const [jobsList, setJobsList] = useState(null);
	const [tab, setTab] = useState(0);
	const [discoveredSchema, setDiscoveredSchema] = useState(null);
	const [submitting, setSubmitting] = useReducer(submittingReducer, {});
	const [editingSchedule, setEditingSchedule] = useState(false);
	const [error, setError] = useState();
	const { datasource } = state;
	const [scheduleType, setScheduleType] = useState(DatasourceScheduleType.MANUAL);
	const [timeUnit, setTimeUnit] = useState('minutes');
	const [units, setUnits] = useState(0);
	const [cronExpression, setCronExpression] = useState('');
	const [cronTimezone, setCronTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
	const isDraft = datasource?.status === DatasourceStatus.DRAFT;
	const numStreams = datasource?.connectionSettings?.syncCatalog?.streams?.length || 0;
	async function fetchDatasource() {
		await API.getDatasource({
			resourceSlug,
			datasourceId,
		}, (res) => {
			const datasource = res?.datasource;
			if (datasource) {
				setScheduleType(datasource?.connectionSettings?.scheduleType);
				if (datasource?.connectionSettings?.scheduleData) {
					const { basicSchedule, cron } = datasource.connectionSettings.scheduleData;
					setTimeUnit(basicSchedule?.timeUnit);
					setUnits(basicSchedule?.units);
					setCronExpression(cron?.cronExpression);
					setCronTimezone(cron?.cronTimezone);
				}
			}
			dispatch(res);
		}, setError, router);
	}

	async function fetchJobsList() {
		await API.getJobsList({
			resourceSlug,
			datasourceId,
		}, setJobsList, setError, router);
	}

	async function fetchSchema() {
		setSubmitting({ fetchSchema: true });
		try {
			await API.getDatasourceSchema({
				resourceSlug,
				datasourceId,
			}, setDiscoveredSchema, setError, router);
		} finally {
			setSubmitting({ fetchSchema: false });
		}
	}

	async function deleteDatasource(datasourceId) {
		setSubmitting({ deleteDatasource: true });
		try {
			await API.deleteDatasource({
				_csrf: csrf,
				resourceSlug,
				datasourceId,
			}, () => {
				toast.success('Deleted datasource');
				router.push(`/${resourceSlug}/datasources`);
			}, () => {
				toast.error('Error deleting datasource');
			}, router);
		} finally {
			setSubmitting({ deleteDatasource: false });
		}
	}

	async function updateStreams(e, sync?: boolean) {
		setSubmitting({ [`updateStreams${sync ? 'sync' : ''}`]: true });
		try {
			const streams = e?.target?.form && Array.from(e.target.form.elements)
				.filter(x => x['checked'] === true)
				.filter(x => !x['dataset']['parent'])
				.map(x => x['name']);
			const selectedFieldsMap = e?.target?.form && Array.from(e.target.form.elements)
				.filter(x => x['checked'] === true)
				.filter(x => x['dataset']['parent'])
				.reduce((acc, x) => {
					acc[x['dataset']['parent']] = (acc[x['dataset']['parent']] || []).concat([x['name']]);
					return acc;
				}, {});
			const body = {
				_csrf: csrf,
				resourceSlug,
				datasourceId,
				streams,
				sync,
				selectedFieldsMap,
			};
			// console.log(body);
			await API.updateDatasourceStreams(body, () => {
				toast.success(`Updated streams${sync ? ' and triggered sync job' : ''}`);
				setDiscoveredSchema(null);
				fetchDatasource();
			}, (res) => {
				toast.error(res);
			}, router);
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
				units,
				cronExpression,
				cronTimezone,
			};
			// console.log(body);
			await API.updateDatasourceSchedule(body, () => {
				toast.success('Edited datasource schedule');
				fetchDatasource();
			}, (res) => {
				toast.error(res);
			}, router);
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

	return (<>

		<Head>
			<title>{`Manage Datasource - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2 flex justify-between'>
			<h3 className='pl-2 font-semibold text-gray-900'>Manage Datasource - {datasource?.originalName}</h3>
			<button
				onClick={() => deleteDatasource(datasource._id)}
				className='inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
				disabled={submitting['deleteDatasource']}
			>
				{submitting['deleteDatasource'] ? <ButtonSpinner /> : <TrashIcon className='h-5 w-5 pe-1' aria-hidden='true' />}
				Delete Datasource
			</button>
		</div>

		<DatasourceTabs callback={setTab} current={tab} datasource={datasource} />

		{/*TODO: component that takes discoveredSchema and datasource*/}
		{tab === 0 && <>

			{discoveredSchema && <form onSubmit={(e) => { e.preventDefault(); }}>
				<StreamsList
					streams={discoveredSchema.discoveredSchema.catalog.streams}
					existingStreams={datasource?.connectionSettings?.syncCatalog?.streams}
				/>
				<button
					onClick={(e) => updateStreams(e)}
					disabled={submitting['updateStreams'] || submitting['updateStreamssync']}
					type='submit'
					className='me-4 rounded-md disabled:bg-slate-400 bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
				>
					{submitting['updateStreams'] && <ButtonSpinner />}
					{submitting['updateStreams'] ? 'Saving...' : 'Save'}
				</button>
				<button
					onClick={(e) => updateStreams(e, true)}
					disabled={submitting['updateStreamssync'] || submitting['updateStreams']}
					type='submit'
					className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					{submitting['updateStreamssync'] && <ButtonSpinner />}
					{submitting['updateStreamssync'] ? 'Saving...' : 'Save and Sync'}
				</button>
			</form>}

			{!discoveredSchema && datasource?.connectionSettings?.syncCatalog && <StreamsList
				streams={datasource.connectionSettings.syncCatalog.streams}
				existingStreams={datasource.connectionSettings.syncCatalog.streams}
				readonly={true}
			/>}
			{!discoveredSchema && isDraft && numStreams === 0 && <>
				<div className='rounded-md bg-yellow-50 p-4 mt-4 mb-2'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' aria-hidden='true' />
						</div>
						<div className='ml-3'>
							<h3 className='text-sm font-bold text-yellow-800'>Draft View</h3>
							<div className='mt-2 text-sm text-yellow-700'>
								<p>
									This data connection is a draft and needs more configuration before it can be used.
								</p>
							</div>
						</div>
					</div>
				</div>
			</>}
			{!discoveredSchema && <span>
				<button
					disabled={submitting['fetchSchema']}
					onClick={() => fetchSchema()}
					className={'rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 my-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'}
				>
					{submitting['fetchSchema'] && <ButtonSpinner />}
					{submitting['fetchSchema'] ? 'Fetching Streams...' : isDraft && numStreams === 0 ? 'Finish Draft' : 'Edit Streams'}
				</button>
			</span>}
		</>}

		{/*TODO: component that takes jobList*/}
		{tab === 1 && <>
			<div className='rounded-lg overflow-hidden shadow mt-4'>
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

		{tab === 2 && datasource.sourceType !== 'file' && <div className='space-y-3'>
			{/*editingSchedule === false && <div className='my-2'>
				<p>Sync schedule type: <strong>{datasource.connectionSettings.scheduleType}</strong></p>
				{datasource.connectionSettings.scheduleType === DatasourceScheduleType.BASICSCHEDULE && <>
					<p>Time Unit: <strong>{datasource.connectionSettings.scheduleData.basicSchedule.timeUnit}</strong></p>
					<p>Units: <strong>{datasource.connectionSettings.scheduleData.basicSchedule.units}</strong></p>
				</>}
				{datasource.connectionSettings.scheduleType === DatasourceScheduleType.CRON && <>
					<p>Cron Express: <strong>{datasource.connectionSettings.scheduleData.cron.cronExpression}</strong></p>
					<p>Timezone: <strong>{datasource.connectionSettings.scheduleData.cron.cronTimezone}</strong></p>
				</>}
			</div>*/}
			<DatasourceScheduleForm
				scheduleType={scheduleType}
				setScheduleType={setScheduleType}
				timeUnit={timeUnit}
				setTimeUnit={setTimeUnit}
				units={units}
				setUnits={setUnits}
				cronExpression={cronExpression}
				setCronExpression={setCronExpression}
				cronTimezone={cronTimezone}
				setCronTimezone={setCronTimezone}
			/>
			<div className='flex space-x-2'>
				<button
					onClick={async (e) => {
						if (!editingSchedule) {
							e.preventDefault();
							setEditingSchedule(true);
						} else {
							await updateSchedule(e);
							setEditingSchedule(false);
						}
					}}
					disabled={submitting['updateStreams']}
					type='submit'
					className={'flex rounded-md disabled:bg-slate-400 bg-indigo-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'}
				>
					{editingSchedule === true ? 'Save Schedule' : 'Edit Schedule'}
				</button>
				{editingSchedule && <button
					onClick={(e) => {
						setEditingSchedule(false);
					}}
					type='submit'
					className={'flex rounded-md disabled:bg-slate-400 bg-gray-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'}
				>
					Cancel
				</button>}
			</div>
		</div>}

		{tab === 3 && <div className='space-y-3'>
			Visualisation
		</div>}

		{tab === 4 && <div className='space-y-3'>
			Settings
		</div>}

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
