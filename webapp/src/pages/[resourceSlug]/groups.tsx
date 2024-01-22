import { ExclamationTriangleIcon, HomeIcon, PlusIcon } from '@heroicons/react/20/solid';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../api';
import GroupCards from '../../components/GroupCards';
import NewButtonSection from '../../components/NewButtonSection';
import { useAccountContext } from '../../context/account';

export default function Groups(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { groups, hasAgents } = state;

	function fetchGroups() {
		API.getGroups({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchGroups();
	}, [resourceSlug]);

	if (groups == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Groups - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2 dark:border-slate-600'>
			<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Groups</h3>
		</div>

		{!hasAgents && <div className='rounded-md bg-yellow-50 p-4'>
			<div className='flex'>
				<div className='flex-shrink-0'>
					<ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' aria-hidden='true' />
				</div>
				<div className='ml-3'>
					<h3 className='text-sm font-medium text-yellow-800'>Attention needed</h3>
					<div className='mt-2 text-sm text-yellow-700'>
						<p>
							You have no agents. You need at least 3 agents to create a group.{' '}
							<Link href={`/${resourceSlug}/agent/add`} className='font-medium text-yellow-700 underline hover:text-yellow-600'>
								Create agents
							</Link>
							.
						</p>
					</div>
				</div>
			</div>
		</div>}

		<GroupCards groups={groups} fetchGroups={fetchGroups} />

		{hasAgents && (groups.length === 0
			? <NewButtonSection
				link={`/${resourceSlug}/group/add`}
				emptyMessage={'No groups'}
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
				message={'Get started by creating a new group.'}
				buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
				buttonMessage={'New Group'}
				disabled={!hasAgents}
			/>
			: <Link href={`/${resourceSlug}/group/add`}>
				<button
					type='button'
					className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
				>
					<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
					New Group
				</button>
			</Link>
		)}

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
