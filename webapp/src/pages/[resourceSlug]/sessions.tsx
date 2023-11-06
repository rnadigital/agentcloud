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
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions, groups } = state;
	const resourceSlug = account?.currentTeam;

	function fetchSessions() {
		API.getSessions({ resourceSlug: resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		if (!props.sessions) {
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

		{sessions.length > 0 && <div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Sessions</h3>
		</div>}
	
		<StartSessionChatbox groups={groups} />
		
		<SessionCards sessions={sessions} fetchSessions={fetchSessions} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || null }));
};
