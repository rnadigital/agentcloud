import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../api';
import { useAccountContext } from '../../context/account';
import StartSessionChatbox from '../../components/StartSessionChatbox';
import SessionCards from '../../components/SessionCards';
// import NewButtonSection from '../../components/NewButtonSection';
import { useRouter } from 'next/router';
import { XMarkIcon, PlusIcon } from '@heroicons/react/20/solid';
// import classNames from '../../components/ClassNames';

export default function Sessions(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;

	const router = useRouter();
	const [newSessionOpen, setNewSessionOpen] = useState(false);
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions } = state;
	const resourceSlug = account?.currentTeam;

	function fetchSessions() {
		API.getSessions({ resourceSlug: resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		if (!sessions) {
			fetchSessions();
		}
	}, [account]);

	if (!sessions) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Sessions - {teamName}</title>
		</Head>

		{sessions.length > 0 && <div className='border-b pb-2 my-2 mb-6'>
			<h3 className='pl-2 font-semibold text-gray-900'>Sessions</h3>
		</div>}
	
		{/*sessions.length === 0 && <NewButtonSection
			link={`/${resourceSlug}/session/add`}
			emptyMessage={'No sessions'}
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
			message={'Get started with a new session.'}
			buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
			buttonMessage={'New Session'}
		/>*/}

		{sessions.length > 0 && <div>
			<button
				onClick={() => setNewSessionOpen(oldSessionOpen => !oldSessionOpen)}
				type='button'
				className='mb-6 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				{newSessionOpen ? <XMarkIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' /> : <PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
				{newSessionOpen ? 'Close' : 'New Session'}
			</button>
		</div>}
		{(newSessionOpen || sessions.length === 0) && <StartSessionChatbox />}
		
		<SessionCards sessions={sessions} fetchSessions={fetchSessions} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || null }));
};
