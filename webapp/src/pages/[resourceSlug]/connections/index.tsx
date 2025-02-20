import * as API from '@api';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import { DatasourcesDataReturnType } from 'controllers/datasource';
import useResponsive from 'hooks/useResponsive';
import { CirclePlus, MessagesSquare, Share2, SquareTerminal } from 'lucide-react';
import { ConnectionsCards } from 'modules/components/connections/ConnectionsCards';
import { ConnectionsTable } from 'modules/components/connections/ConnectionsTable';
import { Button } from 'modules/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from 'modules/components/ui/dialog';
import { useRouter } from 'next/router';
import React, { useEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { NotificationType, WebhookType } from 'struct/notification';
import submittingReducer from 'utils/submittingreducer';

const ConnectionsPage = props => {
	const { isMobile } = useResponsive();
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const [, notificationTrigger]: any = useSocketContext();

	const { account, teamName, csrf } = accountContext as any;

	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<Partial<DatasourcesDataReturnType>>(props);
	const [error, setError] = useState(null);
	const { datasources, models, vectorDbs } = state;
	const [open, setOpen] = useState(false);
	const [spec, setSpec] = useState(null);
	const [airbyteState, setAirbyteState] = useState(null);
	const [airbyteLoading, setAirbyteLoading] = useState(false);

	const [deleting, setDeleting] = useReducer(submittingReducer, {});
	const [deletingMap, setDeletingMap] = useState({});

	async function fetchDatasources(silent = false) {
		await API.getDatasources({ resourceSlug }, dispatch, setError, router);
		await API.checkAirbyteConnection({ resourceSlug }, setAirbyteState, setError, router);
	}
	async function deleteDatasource(datasourceId) {
		setDeleting({ [datasourceId]: true });
		try {
			await API.deleteDatasource(
				{
					_csrf: csrf,
					resourceSlug,
					datasourceId
				},
				async () => {
					setDeletingMap(oldMap => {
						oldMap[datasourceId] = true;
						return oldMap;
					});
					await new Promise(res => setTimeout(res, 700));
					fetchDatasources();
					setDeletingMap(oldMap => {
						delete oldMap[datasourceId];
						return oldMap;
					});
				},
				() => {
					toast.error('Error deleting datasource');
				},
				router
			);
		} finally {
			setDeleting({ [datasourceId]: false });
		}
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
		<div>
			<div className='flex justify-between'>
				<h1 className='font-semibold text-2xl text-foreground'>Connections</h1>

				<button
					onClick={() => router.push(`/${resourceSlug}/connections/add`)}
					className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'>
					<CirclePlus width={10.5} />
					<p className='font-semibold text-sm'>New Connection</p>
				</button>
			</div>
			<div className='overflow-x-auto drop-shadow-lg'>
				{isMobile ? (
					<ConnectionsCards datasources={datasources} />
				) : (
					<ConnectionsTable
						datasources={datasources}
						deleteDatasource={deleteDatasource}
						deleting={deleting}
					/>
				)}
			</div>
		</div>
	);
};

export default ConnectionsPage;

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
