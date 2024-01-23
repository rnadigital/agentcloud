import { Menu, Transition } from '@headlessui/react';
import {
	ArrowPathIcon,
	Cog6ToothIcon,
	DocumentIcon,
	EllipsisHorizontalIcon,
	PlayIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';
import { useAccountContext } from '../context/account';

export default function DatasourceCards({ datasources, fetchDatasources }: { datasources: any[], fetchDatasources?: any }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteDatasource(datasourceId) {
		await API.deleteDatasource({
			_csrf: csrf,
			resourceSlug,
			datasourceId,
		}, () => {
			toast.success('Deleted datasource');
		}, () => {
			toast.error('Error deleting datasource');
		}, router);
		fetchDatasources();
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
							Source Type
						</th>
						<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Last Synced
						</th>
						<th scope='col' className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Actions
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
								<span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize'>
				                    <img src={`https://connectors.airbyte.com/files/metadata/airbyte/source-${datasource.sourceType}/latest/icon.svg`} className='w-6 h-6 me-1.5' />
									{datasource.sourceType}
								</span>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-900'>{datasource.lastSyncedDate ? datasource.lastSyncedDate : 'Never'}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
								<button 
									onClick={() => { /*TODO: sync api call and spinner while syncing*/ }} 
									className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-2 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
									Sync Now
								</button>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
		                        <a href={`/${resourceSlug}/datasource/${datasource._id}`} className='text-gray-500 hover:text-gray-700'>
		                            <Cog6ToothIcon className='h-5 w-5' aria-hidden='true' />
		                        </a>
		                    </td>
						</tr>
					))}
				</tbody>
			</table>
		</div>

	);
}
