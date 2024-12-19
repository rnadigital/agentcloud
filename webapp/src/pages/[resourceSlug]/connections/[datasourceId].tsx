import * as API from '@api';
import { convertQuartzToCron } from 'airbyte/cronconverter';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import useResponsive from 'hooks/useResponsive';
import { Bolt, Box, Clock, Loader, MoveRight, RefreshCcw } from 'lucide-react';
import { ConnectionsProvider } from 'modules/components/connections/ConnectionsContext';
import { ConnectionsIdCards } from 'modules/components/connections/ConnectionsIdCards';
import { ConnectionsIdTabs } from 'modules/components/connections/ConnectionsIdTabs';
import { Button } from 'modules/components/ui/button';
import { useRouter } from 'next/router';
import { useEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import {
	DatasourceScheduleType,
	DatasourceStatus,
	StreamConfig,
	StreamConfigMap
} from 'struct/datasource';
import submittingReducer from 'utils/submittingreducer';

export default function ConnectionsItem(props) {
	const { isMobile } = useResponsive();
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
	console.log(state);
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
		<div className='text-foreground'>
			<section className='flex gap-2 mb-4'>
				<h4 className='text-gray-500 font-semibold'>Connections</h4>
				<span className='text-gray-500'>&gt;</span>
				<h4 className='text-gray-500 font-semibold'>User Feedback</h4>
			</section>
			<ConnectionsProvider
				value={{
					datasource,
					airbyteState,
					jobsList,
					submitting,
					resourceSlug,
					datasourceId,
					csrf
				}}
			>
				{isMobile ? <ConnectionsIdCards /> : <ConnectionsIdTabs />}
			</ConnectionsProvider>
		</div>
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
