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
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { agents, credentials } = state;

	useEffect(() => {
		API.getAgents({ resourceSlug: account.currentTeam }, dispatch, setError, router);
	}, []);
	
	if (agents == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>New Agent - {teamName}</title>
		</Head>

		<AgentForm credentials={credentials} />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
