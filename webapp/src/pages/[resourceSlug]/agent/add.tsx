import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../../api';
import AgentForm from '../../../components/AgentForm';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../../context/account';
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';

export default function Agents(props) {

	const [accountContext] = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { agents } = state;

	useEffect(() => {
		if (!agents) {
			API.getAgents({ resourceSlug: account.currentOrg }, dispatch, setError, router);
		}
	}, []);
	
	if (agents == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>New Agent - {teamName}</title>
		</Head>

		<AgentForm />

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
}
