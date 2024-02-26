import * as API from '@api';
import { ExclamationTriangleIcon, HomeIcon, PlusIcon } from '@heroicons/react/20/solid';
import CrewCards from 'components/CrewCards';
import NewButtonSection from 'components/NewButtonSection';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function Crews(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { crews, hasAgents } = state;

	function fetchCrews() {
		API.getCrews({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchCrews();
	}, [resourceSlug]);

	if (crews == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Crews - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2 dark:border-slate-600'>
			<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Crews</h3>
		</div>

		<CrewCards crews={crews} fetchCrews={fetchCrews} />

		{crews.length === 0
			? <NewButtonSection
				link={`/${resourceSlug}/crew/add`}
				emptyMessage={'No crews'}
				icon={<svg
					className='mx-auto h-12 w-12 text-gray-400'
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
					aria-hidden='true'
				>
					<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-6 h-6'>
						<path strokeLinecap='round' strokeLinejoin='round' d='M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' />
					</svg>
				</svg>}
				message={'Get started by creating a new crew.'}
				buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
				buttonMessage={'New Crew'}
			/>
			: <Link href={`/${resourceSlug}/crew/add`}>
				<button
					type='button'
					className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
				>
					<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
					New Crew
				</button>
			</Link>
		}

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
