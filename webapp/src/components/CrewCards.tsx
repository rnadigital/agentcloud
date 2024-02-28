import { Menu, Transition } from '@headlessui/react';
import {
	EllipsisHorizontalIcon,
	UserGroupIcon,
} from '@heroicons/react/20/solid';
import { useRouter } from 'next/router';
import { Fragment, useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';
import { useAccountContext } from '../context/account';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function CrewCards({ crews, fetchCrews }: { crews: any[], fetchCrews?: any }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteCrew(crewId) {
		API.deleteCrew({
			_csrf: csrf,
			resourceSlug,
			crewId,
		}, () => {
			fetchCrews();
			toast('Deleted crew');
		}, () => {
			toast.error('Error deleting crew');
		}, router);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8 my-4'>
			{crews.map((crew) => (
				<li key={crew._id} className='rounded-xl border border-gray-200 dark:border-slate-600'>
					<div className='flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 dark:bg-slate-800 p-6 rounded-t-xl'>
						<UserGroupIcon className='w-6 h-6' />
						<div className='text-sm font-medium leading-6 text-gray-900 dark:text-white'>{crew.name}</div>
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
												href={`/${resourceSlug}/crew/${crew._id}/edit`}
												className={classNames(
													active ? 'bg-gray-50 dark:bg-slate-700' : '',
													'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
												)}
											>
											Edit
											</a>
										)}
									</Menu.Item>
									<Menu.Item>
										{({ active }) => (
											<button
												onClick={() => deleteCrew(crew._id)}
												className={classNames(
													active ? 'bg-gray-50 dark:bg-slate-700' : '',
													'block px-3 py-1 text-sm leading-6 text-red-600 w-full text-left'
												)}
											>
											Delete
											</button>
										)}
									</Menu.Item>
								</Menu.Items>
							</Transition>
						</Menu>
					</div>
					<dl className='-my-3 divide-y divide-gray-100 px-6 py-3 text-sm leading-6'>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500 dark:text-white'>Members</dt>
							<dd className='text-gray-700 dark:text-white'>
								<div>{crew?.agents?.length}</div>
							</dd>
						</div>
						{/* TODO: what else here?? */}
					</dl>
				</li>
			))}
		</ul>
	);
}
