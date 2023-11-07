import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
	EllipsisHorizontalIcon,
	PlayIcon,
	ArrowPathIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../context/account';
import { toast } from 'react-toastify';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export const SessionStatus = {
	started: 'text-yellow-700 bg-yellow-50 ring-yellow-600/10 fill-yellow-500 dark:bg-yellow-900 dark:text-yellow-200',
	running: 'text-green-700 bg-green-50 ring-green-600/20 fill-green-500 dark:bg-green-900 dark:text-green-200',
	waiting: 'text-gray-600 bg-yellow-50 ring-yellow-500/10 fill-yellow-500 dark:bg-yellow-900 dark:text-yellow-200',
	warning: 'text-orange-700 bg-orange-50 ring-orange-600/10 fill-orange-500 dark:bg-orange-900 dark:text-orange-200',
	errored: 'text-red-700 bg-red-50 ring-red-600/10 fill-red-500 dark:bg-red-900 dark:text-red-200',
	terminated: 'text-gray-700 bg-gray-50 ring-blue-600/10 fill-gray-500 dark:bg-gray-900 dark:text-gray-200',
};

export default function SessionCards({ sessions, fetchSessions }: { sessions: any[], fetchSessions?: any }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const resourceSlug = account.currentTeam;
	const router = useRouter();

	async function deleteSession(sessionId) {
		API.deleteSession({
			_csrf: csrf,
			sessionId,
		}, () => {
			fetchSessions();
			toast('Deleted session');
		}, () => {
			toast.error('Error deleting session');
		}, router);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8'>
			{sessions.map((session) => (
				<li key={session._id} className='overflow-hidden rounded-xl border border-gray-200 dark:border-gray-900'>
					<div className='flex items-center gap-x-4 border-b border-gray-900/5 dark:bg-gray-900 bg-gray-50 p-6'>
						<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path d='M10.1625 12.675H8.13749C7.68749 12.675 7.27499 13.05 7.27499 13.5375C7.27499 14.025 7.64999 14.4 8.13749 14.4H10.1625C10.6125 14.4 11.025 14.025 11.025 13.5375C11.025 13.05 10.65 12.675 10.1625 12.675Z' fill='#111928'/>
							<path d='M15.825 12.675H13.8C13.35 12.675 12.9375 13.05 12.9375 13.5375C12.9375 14.025 13.3125 14.4 13.8 14.4H15.825C16.275 14.4 16.6875 14.025 16.6875 13.5375C16.6875 13.05 16.3125 12.675 15.825 12.675Z' fill='#111928'/>
							<path d='M21.375 10.6125V6.1875C21.75 6.1125 22.0125 5.775 22.0125 5.3625C22.0125 4.9125 21.6375 4.5 21.15 4.5H19.875C19.425 4.5 19.0125 4.875 19.0125 5.3625C19.0125 5.7375 19.275 6.075 19.65 6.1875V10.425H19.2C18.75 8.8125 17.25 7.575 15.4875 7.575H8.55C6.7875 7.575 5.2875 8.775 4.8375 10.425H3.675C2.025 10.425 0.637497 11.775 0.637497 13.4625V13.6125C0.637497 15.2625 1.9875 16.65 3.675 16.65H4.8375C5.2875 18.2625 6.7875 19.5 8.55 19.5H15.525C17.2875 19.5 18.7875 18.3 19.2375 16.65H20.325C21.975 16.65 23.3625 15.3 23.3625 13.6125V13.4625C23.3625 12.15 22.5 11.025 21.375 10.6125ZM2.3625 13.6125V13.4625C2.3625 12.7125 2.9625 12.1125 3.7125 12.1125H4.725V14.925H3.675C2.925 14.925 2.3625 14.325 2.3625 13.6125ZM15.525 17.775H8.55C7.35 17.775 6.375 16.8 6.375 15.6V11.4375C6.375 10.2375 7.35 9.2625 8.55 9.2625H15.525C16.725 9.2625 17.7 10.2375 17.7 11.4375V15.6C17.6625 16.8 16.6875 17.775 15.525 17.775ZM21.675 13.6125C21.675 14.3625 21.075 14.9625 20.325 14.9625H19.35V12.15H20.325C21.075 12.15 21.675 12.75 21.675 13.5V13.6125Z' fill='#111928'/>
						</svg>
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
								<Menu.Items className='absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
									<Menu.Item>
										{({ active }) => (
											<a
												href={`/${resourceSlug}/session/${session._id}`}
												className={classNames(
													active ? 'bg-gray-50' : '',
													'block px-3 py-1 text-sm leading-6 text-gray-900'
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
												onClick={() => deleteSession(session._id)}
												className={classNames(
													active ? 'bg-gray-50' : '',
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
							<dt className='text-gray-500'>Started</dt>
							<dd className='text-gray-700'>
								<time suppressHydrationWarning={true} dateTime={session.startDate}>{new Date(session.startDate).toLocaleString()}</time>
							</dd>
						</div>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500'>Last Updated</dt>
							<dd className='text-gray-700'>
								<time suppressHydrationWarning={true} dateTime={session.lastUpdatedDate}>{new Date(session.lastUpdatedDate).toLocaleString()}</time>
							</dd>
						</div>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500'>Tokens Used</dt>
							<dd className='text-gray-700'>
								<div>{session.tokensUsed}</div>
							</dd>
						</div>
						<div className='flex justify-between gap-x-4 py-2'>
							<dt className='text-gray-500'>Status</dt>
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
