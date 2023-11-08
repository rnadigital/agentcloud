import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import * as API from '../../api';
import { useAccountContext } from '../../context/account';
import StartSessionChatbox from '../../components/StartSessionChatbox';
import SessionCards from '../../components/SessionCards';
import { useRouter } from 'next/router';
import { SessionStatus } from '../../lib/struct/session';
// import classNames from '../../components/ClassNames';

export default function Sessions(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState<string>('all');
	const filterOptions = Object.values(SessionStatus);
	const { sessions, groups } = state;
	const resourceSlug = account?.currentTeam;

	function fetchSessions() {
		API.getSessions({ resourceSlug: resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchSessions();
	}, []);

	if (!sessions) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Sessions - {teamName}</title>
		</Head>

		{sessions.length > 0 && <div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Sessions</h3>
		</div>}
	
		<StartSessionChatbox groups={groups} />

		<div className='w-64 pb-4'>
			<label htmlFor='filter' className='block text-sm font-medium text-gray-700'>
				Status
			</label>
			<select
				id='filter'
				name='filter'
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
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
