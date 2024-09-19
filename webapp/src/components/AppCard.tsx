import * as API from '@api';
import { Menu, MenuItem, Transition } from '@headlessui/react';
import { PlayIcon } from '@heroicons/react/20/solid';
import { EllipsisHorizontalIcon, LinkIcon } from '@heroicons/react/20/solid';
import AgentAvatar from 'components/AgentAvatar';
import classNames from 'components/ClassNames';
import DevBadge from 'components/DevBadge';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { Fragment } from 'react';
import { toast } from 'react-toastify';
import { AppType } from 'struct/app';
import { SharingMode } from 'struct/sharing';

export default function AppCard({ app, startSession, fetchFormData }) {
	const { description, name, icon } = app;
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const origin = typeof location !== 'undefined' ? location.origin : '';
	const posthog = usePostHog();
	async function deleteApp(appId) {
		await API.deleteApp(
			{
				_csrf: csrf,
				resourceSlug,
				appId
			},
			() => {
				toast.success('App deleted successfully');
			},
			toast.error,
			router
		);
		fetchFormData && fetchFormData();
	}
	return (
		<div className='w-full max-w-sm rounded-xl bg-white border dark:border-slate-700 dark:bg-slate-800 px-6 py-4 flex flex-col space-between min-h-50'>
			<span className='flex justify-between'>
				<span className='space-x-2'>
					<DevBadge label='App ID' value={app?._id} />
					<span
						className={`h-6 px-2 py-[0.5px] border text-sm rounded-lg ${
							app.type === AppType.CHAT
								? 'bg-blue-100 text-blue-800 border-blue-300'
								: 'bg-green-100 text-green-800 border-green-300'
						}`}
					>
						{app.type === AppType.CHAT ? 'Chat' : 'Process'}
					</span>
					{app?.sharingConfig?.mode !== SharingMode.TEAM && (
						<span className='tooltip z-100'>
							<span className='tooltiptext text-sm capitalize !w-[80px] !-ml-[40px] whitespace-pre'>
								Copy Link
							</span>
							<span
								className='cursor-pointer h-6 px-2 py-[0.5px] border text-sm rounded-lg bg-yellow-100 text-yellow-800 border-yellow-300 capitalize'
								onClick={async () => {
									try {
										//TODO: refactor the construction of this public app URL to some unified place
										await navigator.clipboard.writeText(
											`${origin}/s/${resourceSlug}/${app.shareLinkShareId}`
										);
										toast.success('Link copied');
									} catch {
										/* ignored for now */
									}
								}}
							>
								{app?.sharingConfig?.mode} <LinkIcon className='h-3 w-3 inline' />
							</span>
						</span>
					)}
				</span>
				<Menu as='div' className=''>
					<Menu.Button className='block p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-white dark:hover:bg-gray-700 rounded'>
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
						<Menu.Items className='absolute z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white dark:bg-slate-800 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
							<Menu.Item>
								{({ active }) => (
									<a
										href={`/${resourceSlug}/app/${app._id}/edit`}
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
										href={`/${resourceSlug}/app/add?appId=${encodeURIComponent(app._id)}`}
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
										onClick={e => {
											e.stopPropagation();
											e.preventDefault();
											posthog.capture('deleteApp', {
												appId: app._id,
												appType: app.type,
												appName: app.name
											});
											deleteApp(app._id);
										}}
										className={classNames(
											active ? 'bg-gray-50 dark:bg-slate-700' : '',
											'block px-3 py-1 text-sm leading-6 text-red-600 w-full text-left dark:text-red-300'
										)}
									>
										Delete
									</button>
								)}
							</Menu.Item>
						</Menu.Items>
					</Transition>
				</Menu>
			</span>
			<div className='flex items-center justify-center p-4'>
				<AgentAvatar agent={app} size={20} />
			</div>
			<a className='h-full' href={`/${resourceSlug}/app/${app._id}/edit`}>
				<div>
					<div className='font-bold text-xl mb-2 dark:text-gray-50'>{name}</div>
					<p className={'text-gray-700 text-base max-h-20 overflow-hidden dark:text-white'}>
						{description}
					</p>
				</div>
			</a>
			<div className='flex flex-col flex-wrap justify-between pt-5 gap-4 grid-cols-1 xl:grid-cols-2'>
				<div className='w-full text-sm text-gray-600 dark:text-gray-50'>
					{app.author ? `By ${app.author}` : 'AgentCloud App'}
				</div>
				<button
					className='rounded-md xl:w-24 h-10 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full inline-flex items-center self-end'
					onClick={() => {
						posthog.capture('startSession', {
							appId: app._id,
							appType: app.type,
							appName: app.name
						});
						startSession(app._id);
					}}
				>
					<PlayIcon className='h-5 w-5 mr-2' />
					Play
				</button>
			</div>
		</div>
	);
}
