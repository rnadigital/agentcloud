import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';
import { useAccountContext } from '../context/account';

export default function ToolList({ tools, fetchTools }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteTool(toolId) {
		API.deleteTool({
			_csrf: csrf,
			resourceSlug,
			toolId,
		}, () => {
			fetchTools();
			toast('Deleted tool');
		}, () => {
			toast.error('Error deleting tool');
		}, router);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
			{tools.map((tool) => (
				<li key={tool._id} className='col-span-1 divide-y divide-gray-200 dark:divide-slate-600 rounded-lg bg-white shadow dark:bg-slate-800 dark:border dark:border-slate-600'>
					<div className='flex w-full items-center justify-between space-x-6 p-6'>
						<div className='flex-1 truncate'>
							<div className='flex items-center space-x-3'>
								<h3 className='truncate text-sm font-medium text-gray-900 dark:text-white'>{tool.name}</h3>
							</div>
							<p className='my-1 truncate text-sm text-gray-500 dark:text-slate-400'>{tool.type} - {tool?.data?.description || tool?.description}</p>
						</div>
						<div className='h-10 w-10 flex-shrink-0 rounded-full bg-gray-300 dark:bg-slate-700 text-center text-xl font-bold pt-1'>
							<span>{tool.name.charAt(0).toUpperCase()}</span>
						</div>
					</div>
					<div>
						<div className='-mt-px flex divide-x divide-gray-200 dark:divide-slate-600'>
							<div className='flex w-0 flex-1'>
								<a
									href={`/${resourceSlug}/tool/${tool._id}/edit`}
									className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white'
								>
									<PencilIcon className='h-5 w-5 text-gray-400 dark:text-white' aria-hidden='true' />
									Edit
								</a>
							</div>
							<div className='-ml-px flex w-0 flex-1'>
								<button
									onClick={(e) => {
										deleteTool(tool._id);
									}}
									className='relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-red-600'
								>
									<TrashIcon className='h-5 w-5 text-red-600' aria-hidden='true' />
									Delete
								</button>
							</div>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
