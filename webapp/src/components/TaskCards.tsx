import { Menu, MenuItem, Transition } from '@headlessui/react';
import { CheckIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import * as API from 'api';
import DevBadge from 'components/DevBadge';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { Fragment } from 'react';
import { toast } from 'react-toastify';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function TaskCards({ tasks, fetchTasks }: { tasks: any[]; fetchTasks?: any }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

	async function deleteTask(taskId) {
		API.deleteTask(
			{
				_csrf: csrf,
				resourceSlug,
				taskId
			},
			() => {
				fetchTasks();
				toast('Deleted task');
			},
			() => {
				toast.error('Error deleting task');
			},
			router
		);
	}

	return (
		<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
			{tasks.map(task => (
				<div
					key={task._id}
					className='relative rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm dark:text-white'
				>
					<div className='flex flex-col'>
						<DevBadge label='Task ID' value={task?._id} />
						<h3 className='text-sm font-semibold truncate'>
							<Link href={`/${resourceSlug}/task/${task._id}/edit`}>{task.name}</Link>
						</h3>
						<p className='text-sm font-medium truncate'>
							&quot;<em>{task.description}</em>&quot;
						</p>
						<div className='mt-2 flex items-center justify-between'>
							<Menu as='div' className='absolute right-2 top-2'>
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
													href={`/${resourceSlug}/task/${task._id}/edit`}
													className={classNames(
														active ? 'bg-gray-50 dark:bg-slate-700' : '',
														'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
													)}
												>
													Edit
												</a>
											)}
										</Menu.Item>
										<MenuItem>
											{({ active }) => (
												<a
													href={`/${resourceSlug}/task/add?taskId=${encodeURIComponent(task._id)}`}
													className={classNames(
														active ? 'bg-gray-50 dark:bg-slate-700' : '',
														'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
													)}
												>
													Clone
												</a>
											)}
										</MenuItem>
										<Menu.Item>
											{({ active }) => (
												<button
													onClick={() => {
														posthog.capture('deleteTask', {
															name: task.name,
															id: task._id,
															toolIds: task?.toolIds || [],
															preferredAgentId: task?.agentId
														});
														deleteTask(task._id);
													}}
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
				</div>
			))}
		</div>
	);
}
