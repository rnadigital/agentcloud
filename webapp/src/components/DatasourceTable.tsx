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
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useReducer,useState } from 'react';
import { toast } from 'react-toastify';
import submittingReducer from 'utils/submittingreducer';

import * as API from '../api';
import { useAccountContext } from '../context/account';

export default function DatasourceCards({ datasources, fetchDatasources }: { datasources: any[], fetchDatasources?: any }) {

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
				toast.success('Deleted datasource');
			}, () => {
				toast.error('Error deleting datasource');
			}, router);
			await fetchDatasources();
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
				toast.success('Sync job triggered');
			}, () => {
				toast.error('Error syncinc');
			}, router);
			await fetchDatasources();
		} finally {
			setSyncing({ [datasourceId]: false });
		}
	}

	return (

		<div className='rounded-lg overflow-hidden shadow'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Name
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							№ Streams
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Source Type
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Schedule Type
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Last Synced
						</th>
						<th scope='col' className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Actions
						</th>
		                <th scope='col' className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
		                    
		                </th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Date Uploaded
						</th>
		                <th scope='col' className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
		                    
		                </th>
					</tr>
				</thead>
				<tbody className='bg-white divide-y divide-gray-200'>
					{datasources.map((datasource) => (
						<tr key={datasource._id}>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='flex items-center'>
									<div className='ml-4'>
										<div className='text-sm font-medium text-gray-900'>{datasource.originalName}</div>
									</div>
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<span className='px-2 inline-flex text-xs leading-5 rounded-full capitalize'>
									{datasource?.connectionSettings?.syncCatalog?.streams?.length || '1'}
								</span>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize'>
				                    <img src={`https://connectors.airbyte.com/files/metadata/airbyte/source-${datasource.sourceType}/latest/icon.svg`} className='w-6 h-6 me-1.5' />
									{datasource.sourceType}
								</span>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<span className='px-2 inline-flex text-xs leading-5 rounded-full capitalize'>
									{datasource?.connectionSettings?.scheduleType || '-'}
								</span>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-900'>{datasource.lastSyncedDate ? new Date(datasource.lastSyncedDate).toLocaleString() : (datasource.sourceType === 'file' ? 'N/A' : 'Never')}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
								{datasource.sourceType !== 'file' &&  <button 
									onClick={() => syncDatasource(datasource._id)} 
									disabled={syncing[datasource._id] || deleting[datasource._id]}
									className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-2 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
								
									{syncing[datasource._id] && <ButtonSpinner />}
									{syncing[datasource._id] ? 'Syncing...' : 'Sync Now'}
								</button>}
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
		                        {datasource.sourceType !== 'file' && <a href={`/${resourceSlug}/datasource/${datasource._id}`} className='text-gray-500 hover:text-gray-700'>
		                            <Cog6ToothIcon className='h-5 w-5' aria-hidden='true' />
		                        </a>}
		                    </td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<span className='px-2 inline-flex text-xs leading-5 rounded-full capitalize'>
									{new Date(datasource.createdDate).toLocaleString()}
								</span>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
		                        <button
		                        	onClick={() => deleteDatasource(datasource._id)}
		                        	className='text-red-500 hover:text-red-700'
		                        	disabled={deleting[datasource._id]}
		                        >
									{deleting[datasource._id] ? <ButtonSpinner /> : <TrashIcon className='h-5 w-5' aria-hidden='true' />}
		                        </button>
		                    </td>
						</tr>
					))}
				</tbody>
			</table>
		</div>

	);
}
