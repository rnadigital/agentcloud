import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
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
	const { sessions, crews, agents } = state;

	async function fetchSessions() {
		await API.getSessions({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchSessions();
	}, [resourceSlug]);
	// console.log('resourceSlug', resourceSlug);

	if (!sessions) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Playground - ${teamName}`}</title>
		</Head>

		<SubscriptionModal open={open} setOpen={setOpen}/>
		<details>
			<summary>debug:</summary>
			{sessions.length > 0 && <div className='w-64 pb-4'>
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
			</div>}
			<SessionCards sessions={sessions.filter(s => filter === 'all' || s.status === filter)} fetchSessions={fetchSessions} />
		</details>
		
		<div className='flex flex-col -mx-3 sm:-mx-6 lg:-mx-8 -my-10 flex flex-col flex-1' style={{ maxHeight: 'calc(100vh - 110px)' }}>
			<div className='flex flex-col mt-auto'>
				<div className='flex flex-row justify-center border-t pt-3 dark:border-slate-600' />
				<div className='flex flex-row justify-center pb-3'>
					<div className='flex items-start space-x-4 basis-1/2'>
						{account && <div className='min-w-max w-9 h-9 rounded-full flex items-center justify-center select-none'>
							<span className={'overflow-hidden w-8 h-8 rounded-full text-center font-bold ring-gray-300 ring-1'}>
								<Blockies seed={account.name} />
							</span>
						</div>}
						<div className='min-w-0 flex-1 h-full'>
							<StartSessionChatbox crews={crews} agents={agents} setOpen={setOpen} fetchSessions={fetchSessions} />
						</div>
					</div>
				</div>
			</div>
		</div>

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
