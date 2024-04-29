import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import {
	EllipsisHorizontalIcon,
} from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { Fragment,useEffect, useState } from 'react';
import { toast } from 'react-toastify';
// import ContentLoader from 'react-content-loader';
function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function PreviewSessionList(props) {

	const [accountContext]: any = useAccountContext();
	const [_, __, sessionTrigger]: any = useSocketContext();
	const { account, teamName, csrf } = accountContext as any;
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const [state, dispatch] = useState(props);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState();
	const { sessions } = state;

	async function fetchSessions(noLoading: boolean = false) {
		!noLoading && setLoading(true);
		const start = Date.now();
		try {
			await API.getSessions({ resourceSlug }, dispatch, setError, router);
		} finally {
			!noLoading && setTimeout(() => {
				setLoading(false);
			}, 500-(Date.now()-start));
		}
	}

	async function deleteSession(sessionId) {
		API.deleteSession({
			_csrf: csrf,
			resourceSlug,
			sessionId,
		}, () => {
			fetchSessions(true);
			toast('Deleted session');
			if (router.asPath.includes(`/session/${sessionId}`)) {
				return router.push(`/${resourceSlug}/apps`);
			}
		}, () => {
			toast.error('Error deleting session');
		}, router);
	}

	useEffect(() => {
		fetchSessions();
	}, []);
	
	useEffect(() => {
		fetchSessions(true);
	}, [sessionTrigger]);
	
	useEffect(() => {
		const interval = setInterval(() => {
			fetchSessions(true);
		}, 30000);
		return () => {
			clearInterval(interval);
		};
	}, []);

	if (!resourceSlug) {
		return null;
	}

	// if (!sessions || loading) {
	// 	// return new Array(5).fill(0).map((x, xi) => (<div key={`contentLoader_${xi}`} className='ps-4 py-2 flex items-center justify-center'>
	// 	// 	<ContentLoader 
	// 	// 		speed={2}
	// 	// 		width={'100%'}
	// 	// 		height={10}
	// 	// 		viewBox='0 0 100% 10'
	// 	// 		backgroundColor='rgb(136, 143, 155)'
	// 	// 		foregroundColor='#5a5a5a'
	// 	// 	>
	// 	// 		<rect x='0' y='0' rx='5' width='100%' height='7' />
	// 	// 	</ContentLoader>
	// 	// </div>));
	// }

	//TODO: sesion infinite scrolling/loading

	return <li className='overflow-hidden'>
		{sessions?.length > 0 && <div className='text-xs font-semibold leading-6 text-indigo-200'>Session History</div>}	
		{(!sessions || loading)
			? <div className='py-2 flex items-center justify-center'>
				<ButtonSpinner />
			</div>
			: <ul>
				{sessions.map(s => (<li key={s._id} className='flex justify-between'>
					<Link
						suppressHydrationWarning
						className={`text-gray-400 hover:text-white hover:bg-gray-700 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full ${router.asPath.includes(`/session/${s._id}`) ? 'bg-gray-800 text-white' : ''}`}
						href={`/${resourceSlug}/session/${s._id}`}
					>
						<p className='overflow-hidden truncate text-ellipsis'>{s.previewLabel || s.name || <span className='text-xs italic'>New Session</span>}</p>
						
					</Link>
					<Menu as='div' className=''>
						<Menu.Button className='block p-2.5 text-gray-400 hover:text-gray-500 hover:text-white hover:bg-gray-700 rounded'>
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
											href={`/${resourceSlug}/session/${s._id}`}
											className={classNames(
												active ? 'bg-gray-50 dark:bg-slate-700' : '',
												'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
											)}
										>
																View
										</a>
									)}
								</Menu.Item>
								<Menu.Item>
									{({ active }) => (
										<button
											onClick={(e) => {
												e.stopPropagation();
												deleteSession(s._id);
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
				</li>))}
			</ul>}
	</li>;

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
