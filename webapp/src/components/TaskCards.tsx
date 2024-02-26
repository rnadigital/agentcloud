import { Menu, Transition } from '@headlessui/react';
import { CheckIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { Fragment } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';
import { useAccountContext } from '../context/account';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function TaskCards({ tasks, fetchTasks }: { tasks: any[], fetchTasks?: any }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteTask(taskId) {
		API.deleteTask({
			_csrf: csrf,
			resourceSlug,
			taskId,
		}, () => {
			fetchTasks();
			toast('Deleted task');
		}, () => {
			toast.error('Error deleting task');
		}, router);
	}

	return (
		<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
			{tasks.map((task) => (
				<div key={task._id} className='relative rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm'>
					<div className='flex items-center justify-between'>
						<h3 className='text-sm font-medium truncate'>
							<Link href={`/${resourceSlug}/task/${task._id}/edit`}>
								&quot;<em>{task.description}</em>&quot;
							</Link>
						</h3>
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
												href={`/${resourceSlug}/task/${task._id}`}
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
												onClick={() => deleteTask(task._id)}
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
				</div>
			))}
		</div>
	);
}

