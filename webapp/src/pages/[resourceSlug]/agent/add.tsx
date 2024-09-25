import * as API from '@api';
import AgentForm from 'components/AgentForm';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { AgentDataReturnType, AgentsDataReturnType } from 'controllers/agent';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function AddAgent(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<AgentsDataReturnType>(props);
	const [cloneState, setCloneState] = useState<AgentDataReturnType>(null);
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);
	const { models, tools, variables } = state;

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

	useEffect(() => {
		setLoading(false);
	}, [state?.agents, cloneState?.agent]);

	if (loading) {
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
					variables={variables}
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
