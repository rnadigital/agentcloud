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
	const { agent } = state;

	useEffect(() => {
		if (!agent) {
			API.getAgent({
				resourceSlug: account.currentTeam,
				agentId: router.query.agentId,
			}, dispatch, setError, router);
		}
	}, []);

	if (agent == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Edit Agent - {teamName}</title>
		</Head>

		<div>
			<a
				className='mb-4 inline-flex align-center rounded-md bg-indigo-600 pe-3 ps-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				href={`/${resourceSlug}/agents`}
			>
				<ChevronLeftIcon className='w-5 me-1' />
				<span>Back</span>
			</a>
		</div>

		<div className='border-b pb-2 my-2 mb-6'>
			<h3 className='font-semibold text-gray-900'>Edit Agent</h3>
		</div>

		<AgentForm editing={true} agent={agent} />

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
