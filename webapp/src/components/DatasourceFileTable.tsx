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
import { useAccountContext } from 'context/account';
import { useNotificationContext } from 'context/notifications';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useReducer,useState } from 'react';
import { toast } from 'react-toastify';
import { DatasourceStatus,datasourceStatusColors } from 'struct/datasource';
import submittingReducer from 'utils/submittingreducer';

export default function DatasourceFileTable({ datasources, fetchDatasources }: { datasources: any[], fetchDatasources?: any }) {

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
			await API.deleteDatasource({
				_csrf: csrf,
				resourceSlug,
				datasourceId,
			}, () => {
				// toast.success();
			}, () => {
				toast.error('Error deleting datasource');
			}, router);
			await fetchDatasources();
		} finally {
			setDeleting({ [datasourceId]: false });
		}
	}

	return (

		<div className='rounded-lg overflow-hidden shadow overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
							Name
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
							Original Filename
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
							Status
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
							Date Uploaded
						</th>
						<th scope='col' className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase'>
							Actions
						</th>
					</tr>
				</thead>
				<tbody className='bg-white divide-y divide-gray-200'>
					{datasources.map((datasource) => (
						<tr key={datasource._id} className='cursor-pointer hover:bg-gray-50' onClick={() => router.push(`/${resourceSlug}/datasource/${datasource._id}`)}>
							<td className='px-6 py-3 whitespace-nowrap flex items-center'>
								<div className='flex items-center'>
									<div className='text-sm font-medium text-gray-900'>{datasource.name}</div>
								</div>
							</td>
							<td className='px-6 py-3 whitespace-nowrap'>
								<div className='flex items-center'>
									<div className='text-sm font-medium text-gray-900'>{datasource.originalName}</div>
								</div>
							</td>
							<td className='px-6 py-3 whitespace-nowrap'>
								<span className={`px-3 py-1 text-sm text-white rounded-full ${datasourceStatusColors[datasource.status] || 'bg-gray-500'} capitalize`}>
									{datasource.status || 'Unknown'}{[DatasourceStatus.PROCESSING, DatasourceStatus.EMBEDDING].includes(datasource.status) && <ButtonSpinner size={14} className='ms-2 -me-1' />}
								</span>
							</td>
							<td className='px-6 py-3 whitespace-nowrap'>
								<span className='text-sm text-gray-900'>
									{new Date(datasource.createdDate).toLocaleString()}
								</span>
							</td>
							<td className='px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-5 items-center'>
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
