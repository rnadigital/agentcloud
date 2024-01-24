import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { SessionStatus } from 'struct/session';

import * as API from '../../api';
import SessionCards from '../../components/SessionCards';
import StartSessionChatbox from '../../components/StartSessionChatbox';
import SubscriptionModal from '../../components/SubscriptionModal';
import { useAccountContext } from '../../context/account';

export default function Sessions(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState<string>('all');
	const [open, setOpen] = useState(false);
	const filterOptions = Object.values(SessionStatus);
	const { sessions, groups, agents } = state;

	async function fetchSessions() {
		await API.getSessions({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchSessions();
	}, [resourceSlug]);

	if (!sessions) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Sessions - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Sessions</h3>
		</div>

		<SubscriptionModal open={open} setOpen={setOpen}/>
	
		<StartSessionChatbox groups={groups} agents={agents} setOpen={setOpen} fetchSessions={fetchSessions} />

		<div className='w-64 pb-4'>
			<label htmlFor='filter' className='block text-sm font-medium text-gray-900 dark:text-slate-400'>
				Status
			</label>
			<select
				id='filter'
				name='filter'
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-slate-800 dark:border-gray-600'
			>
				<option value={'all'}>All</option>
				{filterOptions.map((option) => (
					<option key={option} value={option} className='capitalize'>
						{option}
					</option>
				))}
			</select>
		</div>		

		<SessionCards sessions={sessions.filter(s => filter === 'all' || s.status === filter)} fetchSessions={fetchSessions} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
