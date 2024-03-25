import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import {
	EllipsisHorizontalIcon,
} from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import { useAccountContext } from 'context/account';
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
			if (router.asPath.includes('/session/')) {
				return router.push(`/${resourceSlug}/playground`);
			}
			fetchSessions();
			toast('Deleted session');
		}, () => {
			toast.error('Error deleting session');
		}, router);
	}

	useEffect(() => {
		// if (!resourceSlug) { dispatch({}); }
		fetchSessions();
	}, [resourceSlug]);
	
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

	if (!sessions || loading) {
		return <div className='py-2 flex items-center justify-center'>
			<ButtonSpinner />
		</div>;
		// return new Array(5).fill(0).map((x, xi) => (<div key={`contentLoader_${xi}`} className='ps-4 py-2 flex items-center justify-center'>
		// 	<ContentLoader 
		// 		speed={2}
		// 		width={'100%'}
		// 		height={10}
		// 		viewBox='0 0 100% 10'
		// 		backgroundColor='rgb(136, 143, 155)'
		// 		foregroundColor='#5a5a5a'
		// 	>
		// 		<rect x='0' y='0' rx='5' width='100%' height='7' />
		// 	</ContentLoader>
		// </div>));
	}

	return sessions.slice(0, 5).map(s => (<li key={s._id} className='ps-4'>
		<Link
			suppressHydrationWarning
			className='text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
			href={`/${resourceSlug}/session/${s._id}`}
			onClick={(e: any) => e.target.tagName === 'svg' && e.preventDefault()}
		>
			<p className='overflow-hidden truncate text-ellipsis'>{s.previewLabel || s.name || <span className='text-xs italic'>New Session</span>}</p>
			<Menu as='div' className='relative ml-auto p-0 m-0 h-full'>
				<Menu.Button className='-m-2 block p-2.5 text-gray-400 hover:text-gray-500 hover:text-white hover:bg-gray-700 rounded'>
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
									onClick={() => deleteSession(s._id)}
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
		</Link>		
	</li>));

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
