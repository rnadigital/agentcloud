import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../../../api';
import AgentForm from '../../../../components/AgentForm';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../../../context/account';
import { PhotoIcon, UserCircleIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';

export default function EditAgent(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const resourceSlug = account.currentTeam;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { agent, credentials, tools } = state;

	useEffect(() => {
		API.getAgent({
			resourceSlug: account.currentTeam,
			agentId: router.query.agentId,
		}, dispatch, setError, router);
	}, []);

	if (agent == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Edit Agent - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2 mb-6'>
			<h3 className='font-semibold text-gray-900'>Edit Agent</h3>
		</div>

		<AgentForm editing={true} agent={agent} credentials={credentials} tools={tools} />

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
