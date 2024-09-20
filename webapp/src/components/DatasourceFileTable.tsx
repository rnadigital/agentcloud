import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import {
	ArrowPathIcon,
	Cog6ToothIcon,
	DocumentIcon,
	EllipsisHorizontalIcon,
	PlayIcon,
	TrashIcon
} from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import DatasourceStatusIndicator from 'components/DatasourceStatusIndicator'; // Update this path as necessary
import DevBadge from 'components/DevBadge';
import { useAccountContext } from 'context/account';
import { useNotificationContext } from 'context/notifications';
import { useRouter } from 'next/router';
import { useReducer } from 'react';
import { toast } from 'react-toastify';
import { DatasourceStatus, datasourceStatusColors } from 'struct/datasource';
import submittingReducer from 'utils/submittingreducer';

export default function DatasourceFileTable({
	datasources,
	fetchDatasources
}: {
	datasources: any[];
	fetchDatasources?: any;
}) {
	const [notificationContext, refreshNotificationContext]: any = useNotificationContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [syncing, setSyncing] = useReducer(submittingReducer, {});
	const [deleting, setDeleting] = useReducer(submittingReducer, {});

	async function deleteDatasource(datasourceId) {
		setDeleting({ [datasourceId]: true });
		try {
			await API.deleteDatasource(
				{
					_csrf: csrf,
					resourceSlug,
					datasourceId
				},
				() => {
					// toast.success('Datasource deleted successfully');
				},
				err => {
					toast.error(err);
				},
				router
			);
			await fetchDatasources();
		} finally {
			setDeleting({ [datasourceId]: false });
		}
	}

	async function syncDatasource(datasourceId) {
		setSyncing({ [datasourceId]: true });
		try {
			await API.syncDatasource(
				{
					_csrf: csrf,
					resourceSlug,
					datasourceId
				},
				() => {
					fetchDatasources();
				},
				() => {
					toast.error('Error syncing');
				},
				router
			);
		} finally {
			setSyncing({ [datasourceId]: false });
		}
	}

	return (
		<div className='rounded-lg overflow-hidden shadow overflow-x-auto'>
			{datasources?.length > 0 && (
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-white dark:bg-slate-800 dark:!border-slate-700'>
						<tr>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
							>
								Name
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
							>
								Original Filename
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
							>
								Status
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
							>
								Date Uploaded
							</th>
							<th
								scope='col'
								className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase dark:text-white'
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200 dark:bg-slate-800'>
						{datasources.map(datasource => {
							return (
								<tr
									key={datasource._id}
									className='hover:bg-gray-50 dark:hover:bg-slate-700 dark:!border-slate-700 dark:text-white'
								>
									<td
										className='px-6 py-3 whitespace-nowrap flex items-center'
										// onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}
									>
										<div className='flex items-center me-2'>
											<div className='text-sm font-medium text-gray-900 dark:text-white'>
												{datasource.name}
											</div>
										</div>
										<DevBadge value={datasource?._id} />
									</td>
									<td
										className='px-6 py-3 whitespace-nowrap'
										// onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}
									>
										<div className='flex items-center'>
											<div className='text-sm font-medium text-gray-900 dark:text-white'>
												{datasource.originalName}
											</div>
										</div>
									</td>
									<td
										className='px-6 py-3 whitespace-nowrap'
										// onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}
									>
										<DatasourceStatusIndicator datasource={datasource} />
									</td>
									<td
										className='px-6 py-3 whitespace-nowrap'
										// onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}
									>
										<span
											suppressHydrationWarning
											className='text-sm text-gray-900 dark:text-white'
										>
											{new Date(datasource.createdDate).toLocaleString()}
										</span>
									</td>
									<td className='px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-5 items-center'>
										<button
											onClick={() => {
												// if (datasource.status !== DatasourceStatus.READY) {
												// 	setConfirmClose(datasource._id);
												// } else {
												syncDatasource(datasource._id);
												// }
											}}
											disabled={
												syncing[datasource._id] ||
												deleting[datasource._id] ||
												datasource.status !== DatasourceStatus.READY
											}
											className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-2 -my-1 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-white'
										>
											{syncing[datasource._id] && (
												<ButtonSpinner size={14} className='ms-2 -me-1' />
											)}
											{syncing[datasource._id] ? 'Syncing...' : 'Sync Now'}
										</button>
										{/*<a href={`/${resourceSlug}/datasource/${datasource._id}`} className='text-gray-500 hover:text-gray-700'>
		                            <Cog6ToothIcon className='h-5 w-5' aria-hidden='true' />
		                        </a>*/}
										<button
											onClick={() => deleteDatasource(datasource._id)}
											className='text-red-500 hover:text-red-700'
											disabled={deleting[datasource._id]}
										>
											{deleting[datasource._id] ? (
												<ButtonSpinner size={14} />
											) : (
												<TrashIcon className='h-5' aria-hidden='true' />
											)}
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}
		</div>
	);
}
