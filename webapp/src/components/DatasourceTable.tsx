import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import {
	ArrowPathIcon,
	Cog6ToothIcon,
	DocumentIcon,
	EllipsisHorizontalIcon,
	PlayIcon,
	TrashIcon,
} from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import ProgressBar from 'components/ProgressBar';
import { useAccountContext } from 'context/account';
import { useNotificationContext } from 'context/notifications';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useReducer,useState } from 'react';
import { toast } from 'react-toastify';
import { DatasourceStatus,datasourceStatusColors } from 'struct/datasource';
import submittingReducer from 'utils/submittingreducer';

export default function DatasourceTable({ datasources, fetchDatasources }: { datasources: any[], fetchDatasources?: any }) {

	const [notificationContext, refreshNotificationContext]: any = useNotificationContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [syncing, setSyncing] = useReducer(submittingReducer, {});
	const [deleting, setDeleting] = useReducer(submittingReducer, {});
	const [deletingMap, setDeletingMap] = useState({});

	async function deleteDatasource(datasourceId) {
		setDeleting({ [datasourceId]: true });
		try {
			await API.deleteDatasource({
				_csrf: csrf,
				resourceSlug,
				datasourceId,
			}, async () => {
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
			}, () => {
				toast.error('Error deleting datasource');
			}, router);
		} finally {
			setDeleting({ [datasourceId]: false });
		}
	}

	async function syncDatasource(datasourceId) {
		setSyncing({ [datasourceId]: true });
		try {
			await API.syncDatasource({
				_csrf: csrf,
				resourceSlug,
				datasourceId,
			}, () => {
				fetchDatasources();
			}, () => {
				toast.error('Error syncing');
			}, router);
		} finally {
			setSyncing({ [datasourceId]: false });
		}
	}

	return (

		<div className='rounded-lg overflow-hidden shadow overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200 dark:!border-slate-700'>
				<thead className='bg-gray-50 dark:bg-slate-800 dark:!border-slate-700'>
					<tr>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'>
							Type
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'>
							Name
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'>
							Status
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'>
							Schedule Type
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'>
							Last Synced
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'>
							Date Uploaded
						</th>
						<th scope='col' className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase dark:text-white'>
							Actions
						</th>
					</tr>
				</thead>
				<tbody className='bg-white divide-y divide-gray-200 dark:bg-slate-800'>
					{datasources.map((datasource) => (
						<tr key={datasource._id} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white dark:!border-slate-700 transition-all opacity-1 duration-700 ${deletingMap[datasource._id] ? 'bg-red-400' : 'cursor-pointer hover:bg-gray-50'}`} style={{ borderColor: deletingMap[datasource._id] ? 'red' : '' }}>
							<td className='px-6 py-3 whitespace-nowrap flex items-center' onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}>
								<img src={`https://connectors.airbyte.com/files/metadata/airbyte/source-${datasource.sourceType}/latest/icon.svg`} className='w-6 me-1.5' />
								<span className='px-2 inline-flex text-sm leading-6 rounded-full capitalize'>
				                    {datasource.sourceType}
								</span>
							</td>
							<td className='px-6 py-3 whitespace-nowrap' onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}>
								<div className='flex items-center'>
									<div className='text-sm font-medium text-gray-900 dark:text-white'>{datasource.name}</div>
								</div>
							</td>
							<td className='px-6 py-3 whitespace-nowrap' onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}>
								{DatasourceStatus.EMBEDDING === datasource.status
									? <ProgressBar total={datasource.recordCount?.total} success={datasource.recordCount?.success} failure={datasource.recordCount?.failure} />
									: <div className={`max-w-[300px] px-3 py-[2px] text-sm text-white text-center rounded-full barberpole capitalize`}>
										{datasource.status || 'Unknown'}{[DatasourceStatus.PROCESSING, DatasourceStatus.EMBEDDING].includes(datasource.status) && <ButtonSpinner size={14} className='ms-2 -me-1' />}
									</div>}
							</td>
							<td className='px-6 py-3 whitespace-nowrap' onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}>
								<span className='px-2 inline-flex text-sm leading-5 rounded-full capitalize'>
									{datasource?.connectionSettings?.scheduleType || '-'}
								</span>
							</td>
							<td className='px-6 py-3 whitespace-nowrap' onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}>
								<div className='text-sm text-gray-900 dark:text-white' suppressHydrationWarning>
									{datasource.sourceType === 'file' ? 'N/A' : (datasource.lastSyncedDate ? new Date(datasource.lastSyncedDate).toLocaleString() : 'Never')}
								</div>
							</td>
							<td className='px-6 py-3 whitespace-nowrap' onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}>
								<span suppressHydrationWarning className='text-sm text-gray-900 dark:text-white'>
									{new Date(datasource.createdDate).toLocaleString()}
								</span>
							</td>
							<td className='px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-5 items-center'>
								{datasource.sourceType !== 'file' && <button
									onClick={() => syncDatasource(datasource._id)}
									disabled={syncing[datasource._id]
										|| deleting[datasource._id]
										|| (datasource.status === DatasourceStatus.DRAFT && !datasource?.connectionSettings?.syncCatalog?.streams?.length)
										|| [DatasourceStatus.PROCESSING, DatasourceStatus.EMBEDDING].includes(datasource.status)}
									className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-2 -my-1 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-white'
								>
								
									{syncing[datasource._id] && <ButtonSpinner size={14} className='ms-2 -me-1' />}
									{syncing[datasource._id] ? 'Syncing...' : 'Sync Now'}
								</button>}
								{/*<a href={`/${resourceSlug}/datasource/${datasource._id}`} className='text-gray-500 hover:text-gray-700'>
									<Cog6ToothIcon className='h-5 w-5' aria-hidden='true' />
								</a>*/}
								<button
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										deleteDatasource(datasource._id);
									}}
		                        	className='text-red-500 hover:text-red-700'
		                        	disabled={deleting[datasource._id]}
		                        >
									{deleting[datasource._id] ? <ButtonSpinner size={14} /> : <TrashIcon className='h-5' aria-hidden='true' />}
		                        </button>
		                    </td>
						</tr>
					))}
				</tbody>
			</table>
		</div>

	);
}
