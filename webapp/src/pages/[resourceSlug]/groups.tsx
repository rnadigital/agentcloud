import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../context/account';
import NewButtonSection from '../../components/NewButtonSection';
import { HomeIcon, PlusIcon } from '@heroicons/react/20/solid';

export default function Groups(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const resourceSlug = account?.currentTeam;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { groups } = state;

	function fetchGroups() {
		API.getGroups({ resourceSlug: resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		if (!groups) {
			fetchGroups();
		}
	}, [account]);

	if (!groups) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Groups - {teamName}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Groups</h3>
		</div>

		{groups.length === 0 && <NewButtonSection
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
		/>}

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
}
