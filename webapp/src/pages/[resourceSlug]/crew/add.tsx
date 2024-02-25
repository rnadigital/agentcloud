import * as API from '@api';
import CrewForm from 'components/CrewForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function AddCrew(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [agentChoices, setAgentChoices] = useState(null);
	const [error, setError] = useState();
	const { crews } = state;

	async function fetchAgents() {
		API.getCrews({ resourceSlug }, dispatch, setError, router);
		await API.getAgents({ resourceSlug }, setAgentChoices, setError, router);
	}

	useEffect(() => {
		if (crews == null || agentChoices == null) {
			fetchAgents();
		}
	}, [resourceSlug]);
	
	if (crews == null || agentChoices == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`New Crew - ${teamName}`}</title>
		</Head>

		<CrewForm agentChoices={agentChoices?.agents} fetchAgents={fetchAgents} />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
