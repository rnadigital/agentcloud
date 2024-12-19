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
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger>
						<button className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'>
							<CirclePlus width={10.5} />
							<p className='font-semibold text-sm'>New Connection</p>
						</button>
					</DialogTrigger>
					<DialogContent className='rounded-lg w-[95%] lg:min-w-[800px] text-foreground'>
						<div className='p-2 lg:p-6 text-center space-y-6'>
							<div className='text-sm p-4 rounded-md text-[#4937a6] bg-purple-50 flex flex-col lg:flex-row gap-2 items-center justify-center'>
								<p className='font-bold'>
									🎉 Your vector database is all set, and your data sources are wired —
								</p>
								<p>time to query like a pro!</p>
							</div>
							<div className='border border-indigo-200 p-10 relative rounded-lg bg-gradient-to-b from-white to-indigo-50 flex flex-col items-center justify-between gap-4 '>
								<h2 className='text-l font-bold statica lg:absolute lg:-top-4 lg:left-1/2 transform lg:-translate-x-1/2 bg-white text-[#612D89]'>
									✨ Take it to the Next Level ✨
								</h2>
								<div className='gap-6 mt-4 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2'>
									<div className='text-sm text-gray-700 flex flex-col items-center gap-2 w-full my-2'>
										<MessagesSquare width={20} color='#3F38B7' />
										<p className='font-medium'>Turn Your Data Into Powerful Chat Apps!</p>
									</div>
									<div className='text-sm text-gray-700 flex flex-col items-center gap-2 w-full my-2'>
										<SquareTerminal width={20} color='#3F38B7' />
										<p className='font-medium'>Embed Your Chat App Seamlessly using an iframe</p>
									</div>
									<div className='text-sm text-gray-700 flex flex-col items-center gap-2 w-full my-2'>
										<Share2 width={20} color='#3F38B7' />
										<p className='font-medium'>Share App with your team to quickly query data</p>
									</div>
								</div>

								<Button
									onClick={() => setIsDialogOpen(false)}
									className='flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-900 text-white py-2.5 px-4 rounded-lg w-full'
								>
									Create Chat App
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
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
