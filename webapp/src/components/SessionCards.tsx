import { Menu, Transition } from '@headlessui/react';
import {
	ArrowPathIcon,
	ChatBubbleLeftIcon,
	EllipsisHorizontalIcon,
	PlayIcon
} from '@heroicons/react/20/solid';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export const SessionStatus = {
	started:
		'text-yellow-700 bg-yellow-50 ring-yellow-600/10 fill-yellow-500 dark:bg-yellow-900 dark:text-yellow-200',
	running:
		'text-green-700 bg-green-50 ring-green-600/20 fill-green-500 dark:bg-green-900 dark:text-green-200',
	waiting:
		'text-gray-600 bg-yellow-50 ring-yellow-500/10 fill-yellow-500 dark:bg-yellow-900 dark:text-yellow-200',
	warning:
		'text-orange-700 bg-orange-50 ring-orange-600/10 fill-orange-500 dark:bg-orange-900 dark:text-orange-200',
	errored: 'text-red-700 bg-red-50 ring-red-600/10 fill-red-500 dark:bg-red-900 dark:text-red-200',
	terminated:
		'text-gray-700 bg-gray-50 ring-blue-600/10 fill-gray-500 dark:bg-gray-900 dark:text-gray-200'
};

export default function SessionCards({
	sessions,
	fetchSessions
}: {
	sessions: any[];
	fetchSessions?: any;
}) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteSession(sessionId) {
		API.deleteSession(
			{
				_csrf: csrf,
				resourceSlug,
				sessionId
			},
			() => {
				fetchSessions();
				toast('Deleted session');
			},
			() => {
				toast.error('Error deleting session');
			},
			router
		);
	}

	async function cancelSession(sessionId) {
		API.cancelSession(
			{
				_csrf: csrf,
				resourceSlug,
				sessionId
			},
			() => {
				fetchSessions();
				toast('Cancelled session');
			},
			() => {
				toast.error('Error cancelling session');
			},
			router
		);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8'>
			{sessions.map(session => (
				<li
					key={session._id}
					className='overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600'
				>
					<div className='flex items-center gap-x-4 border-b border-gray-900/5 dark:bg-slate-800 bg-gray-50 p-6'>
						<ChatBubbleLeftIcon className='h-6 w-6' />
						<Link
							href={`/${resourceSlug}/session/${session._id}`}
							className='cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap'
						>
							{session.prompt}
						</Link>
						{/*<img
							src={'/images/favicon.ico'}
							alt={session.name.charAt(0).toUpperCase()}
							className='h-12 w-12 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10 text-center font-bold'
						/>*/}
						<div className='text-sm font-medium leading-6 text-gray-900'>{session.name}</div>
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
												href={`/${resourceSlug}/session/${session._id}`}
												className={classNames(
													active ? 'bg-gray-50 dark:bg-slate-700' : '',
													'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
												)}
											>
												View
											</a>
										)}
									</Menu.Item>
									{/* TODO: onclick cancel, cancel this session? */}
									<Menu.Item>
										{({ active }) => (
											<button
												onClick={() => cancelSession(session._id)}
												className={classNames(
													active ? 'bg-gray-50 dark:bg-slate-700' : '',
													'block px-3 py-1 text-sm leading-6 text-red-600 w-full text-left'
												)}
											>
												Cancel
											</button>
										)}
									</Menu.Item>
									<Menu.Item>
										{({ active }) => (
											<button
												onClick={() => deleteSession(session._id)}
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
					<dl className='-my-3 divide-y divide-gray-100 dark:divide-gray-900 px-6 py-3 text-sm leading-6'>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500 dark:text-white'>Started</dt>
							<dd className='text-gray-700 dark:text-white'>
								<time suppressHydrationWarning={true} dateTime={session.startDate}>
									{new Date(session.startDate).toLocaleString()}
								</time>
							</dd>
						</div>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500 dark:text-white'>Last Updated</dt>
							<dd className='text-gray-700 dark:text-white'>
								<time suppressHydrationWarning={true} dateTime={session.lastUpdatedDate}>
									{new Date(session.lastUpdatedDate).toLocaleString()}
								</time>
							</dd>
						</div>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500 dark:text-white'>Tokens Used</dt>
							<dd className='text-gray-700 dark:text-white'>
								<div>{session.tokensUsed}</div>
							</dd>
						</div>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500 dark:text-white'>Status</dt>
							<dd className='flex items-start gap-x-2'>
								<div
									className={classNames(
										SessionStatus[session.status],
										'capitalize rounded-md py-1 px-2 text-xs font-medium ring-1 ring-inset'
									)}
								>
									{session.status}
								</div>
							</dd>
						</div>
					</dl>
				</li>
			))}
		</ul>
	);
}
