import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../../api';
import AgentForm from '../../../components/AgentForm';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../../context/account';

export default function AddAgent(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { agents, credentials, tools, datasources } = state;

	async function fetchAgentFormData() {
		await API.getAgents({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAgentFormData();
	}, [resourceSlug]);
	
	if (agents == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`New Agent - ${teamName}`}</title>
		</Head>

		<AgentForm datasources={datasources} credentials={credentials} tools={tools} fetchAgentFormData={fetchAgentFormData} />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
