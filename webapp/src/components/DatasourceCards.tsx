import { Menu, Transition } from '@headlessui/react';
import {
	ArrowPathIcon,
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
		<ul role='list' className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8'>
			{datasources.map((datasource) => (
				<li key={datasource._id} className='rounded-xl border border-gray-200 dark:border-slate-600'>
					<div className='flex items-center gap-x-4 border-b border-gray-900/5 dark:bg-slate-800 bg-gray-50 p-6'>
						<img src={`https://connectors.airbyte.com/files/metadata/airbyte/source-${datasource.sourceType}/latest/icon.svg`} className='w-6 h-6' />
						<Link
							href={`/${resourceSlug}/datasource/${datasource._id}/edit`}
							className='cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap'
						>
							{datasource.originalName}
							<span className='ms-2 inline-flex items-center rounded-md bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10'>
								{datasource.sourceType}
							</span>
						</Link>
						{/*<div className='text-sm font-medium leading-6 text-gray-900'></div>*/}
						<Menu as='div' className='relative ml-auto'>
							<Menu.Button className='-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500'>
								<span className='sr-only'>Open options</span>
								<EllipsisHorizontalIcon className='h-5 w-5' aria-hidden='true' />
							</Menu.Button>
							<Transition
								as={Fragment}
								enter='transition ease-out duration-100'
								enterFrom='transform opacity-0 scale-95'
								enterTo='transform opacity-100 scale-100'
								leave='transition ease-in duration-75'
								leaveFrom='transform opacity-100 scale-100'
								leaveTo='transform opacity-0 scale-95'
							>
								<Menu.Items className='absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white dark:bg-slate-800 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
									<Menu.Item>
										{({ active }) => (
											<a
												href={`/${resourceSlug}/datasource/${datasource._id}/edit`}
												className={`${active ? 'bg-gray-50 dark:bg-slate-700' : ''} block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white`}
											>
											Edit
											</a>
										)}
									</Menu.Item>
									{/* TODO: onclick cancel, cancel this session? */}
									<Menu.Item>
										{({ active }) => (
											<button
												onClick={() => deleteDatasource(datasource._id)}
												className={`${active ? 'bg-gray-50 dark:bg-slate-700' : ''} block px-3 py-1 text-sm leading-6 text-red-600 w-full text-left`}
											>
											Delete
											</button>
										)}
									</Menu.Item>
								</Menu.Items>
							</Transition>
						</Menu>
					</div>
				</li>
			))}
		</ul>
	);
}
