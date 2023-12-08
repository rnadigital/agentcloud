import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
	EllipsisHorizontalIcon,
	PlayIcon,
	ArrowPathIcon,
	ChatBubbleLeftIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../context/account';
import { toast } from 'react-toastify';

export default function DatasourceCards({ datasources, fetchDatasources }: { datasources: any[], fetchDatasources?: any }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteDatasource(datasourceId) {
		API.deleteDatasource({
			_csrf: csrf,
			resourceSlug,
			datasourceId,
		}, () => {
			fetchDatasources();
			toast('Deleted datasource');
		}, () => {
			toast.error('Error deleting datasource');
		}, router);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8'>
			{datasources.map((datasource) => (
				<li key={datasource._id} className='overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600'>
					<div className='flex items-center gap-x-4 border-b border-gray-900/5 dark:bg-slate-800 bg-gray-50 p-6'>
						<ChatBubbleLeftIcon className='h-6 w-6' />
						<Link
							href={`/${resourceSlug}/datasource/${datasource._id}`}
							className='cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap'
						>
							{datasource.name}
						</Link>
						<div className='text-sm font-medium leading-6 text-gray-900'>{datasource.sourceType}</div>
						<Menu as='div' className='relative ml-auto'>
							{/* ...Menu and Transition components... */}
						</Menu>
					</div>
				</li>
			))}
		</ul>
	);
}
