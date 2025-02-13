import * as API from '@api';
import { PlusIcon } from '@heroicons/react/20/solid';
import CreateDatasourceForm from 'components/CreateDatasourceForm';
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import DatasourceFileTable from 'components/DatasourceFileTable';
import DatasourceTable from 'components/DatasourceTable';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { NotificationType, WebhookType } from 'struct/notification';

export default function Datasources(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const [, notificationTrigger]: any = useSocketContext();

	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState(null);
	const { datasources, models, vectorDbs } = state;
	const filteredDatasources = datasources?.filter(x => !x.hidden);
	const [open, setOpen] = useState(false);
	const [spec, setSpec] = useState(null);
	const [airbyteState, setAirbyteState] = useState(null);
	const [airbyteLoading, setAirbyteLoading] = useState(false);

	async function fetchDatasources(silent = false) {
		await API.getDatasources({ resourceSlug }, dispatch, setError, router);
		await API.checkAirbyteConnection({ resourceSlug }, setAirbyteState, setError, router);
	}

	useEffect(() => {
		if (
			!notificationTrigger ||
			(notificationTrigger?.type === NotificationType.Webhook &&
				notificationTrigger?.details?.webhookType === WebhookType.SuccessfulSync)
		) {
			fetchDatasources();
		}
		fetchDatasources();
		refreshAccountContext();
	}, [resourceSlug, notificationTrigger]);

	useEffect(() => {
		if (
			!notificationTrigger ||
			(notificationTrigger?.type === NotificationType.Webhook &&
				notificationTrigger?.details?.webhookType === WebhookType.SuccessfulSync)
		) {
			fetchDatasources();
		}
	}, [notificationTrigger]);

	//Backup polling for refresing while datasources are embedding, to supplement socket or fallback in case of failed socket connection
	useEffect(() => {
		const interval = setInterval(() => {
			fetchDatasources();
		}, 10000);
		return () => {
			clearInterval(interval);
		};
	}, [resourceSlug, notificationTrigger]);

	if (!datasources) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Datasources - ${teamName}`}</title>
			</Head>

			<PageTitleWithNewButton
				list={filteredDatasources}
				title='File Uploads'
				searchQuery=''
				setSearchQuery={() => {}}
			/>

			<span className='pt-1 mb-3 w-full'>
				<CreateDatasourceForm
					models={models}
					fetchDatasourceFormData={fetchDatasources}
					hideTabs={true}
					spec={spec}
					setSpec={setSpec}
					initialStep={1}
					fetchDatasources={fetchDatasources}
					vectorDbs={vectorDbs}
				/>
			</span>

			<DatasourceFileTable
				datasources={filteredDatasources.filter(d => d?.sourceType === 'file')}
				fetchDatasources={fetchDatasources}
			/>

			<span className='py-8 h-1'></span>

			{airbyteState?.isEnabled && (
				<PageTitleWithNewButton
					searchQuery=''
					setSearchQuery={() => {}}
					list={filteredDatasources}
					title='Data Connections'
					buttonText='New Connection'
					onClick={async () => {
						if (airbyteState?.isEnabled) {
							setOpen(true);
						} else {
							await API.checkAirbyteConnection({ resourceSlug }, setAirbyteState, setError, router);
						}
					}}
				/>
			)}

			{!airbyteState?.isEnabled && (
				<button
					type='button'
					onClick={async () => {
						setAirbyteLoading(true);
						await API.checkAirbyteConnection(
							{ resourceSlug },
							({ isEnabled }) => {
								if (isEnabled) {
									toast.success('Airbyte is enabled');
								} else {
									toast.error('Failed to enable Airbyte');
								}
								setAirbyteState({ isEnabled });
							},
							setError,
							router
						);
						setAirbyteLoading(false);
					}}
					className='inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed ml-auto mb-2'
					disabled={airbyteLoading}>
					{airbyteLoading ? 'Enabling Airbyte...' : 'Enable Airbyte'}
				</button>
			)}

			<CreateDatasourceModal
				open={open}
				setOpen={setOpen}
				callback={() => {
					setOpen(false);
					fetchDatasources();
				}}
				initialStep={2}
			/>

			<DatasourceTable
				datasources={filteredDatasources.filter(d => d?.sourceType !== 'file')}
				fetchDatasources={fetchDatasources}
				isAirbyteEnabled={airbyteState?.isEnabled}
			/>
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
