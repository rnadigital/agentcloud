import Spinner from 'components/Spinner';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../api';
import AgentForm from '../../../components/AgentForm';
import { useAccountContext } from '../../../context/account';

export default function AddAgent(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, agentId } = router.query;
	const [state, dispatch] = useState(props);
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const { agents, models, tools } = state;

	async function fetchAgentFormData() {
		await API.getAgents({ resourceSlug }, dispatch, setError, router);
	}

	async function fetchEditData(agentId) {
		await API.getAgent({ resourceSlug, agentId }, setCloneState, setError, router);
	}

	useEffect(() => {
		fetchAgentFormData();
	}, []);

	useEffect(() => {
		if (typeof location != undefined) {
			const agentId = new URLSearchParams(location.search).get('agentId');
			fetchEditData(agentId);
		}
	}, []);

	if (agents == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`New Agent - ${teamName}`}</title>
			</Head>

			<span className='sm:w-full md:w-1/2 xl:w-1/3'>
				<AgentForm
					models={models}
					tools={tools}
					fetchAgentFormData={fetchAgentFormData}
					agent={cloneState?.agent}
					editing={false}
				/>
			</span>
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
