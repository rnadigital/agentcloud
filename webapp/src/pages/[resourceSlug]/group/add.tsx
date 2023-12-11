import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../../api';
import GroupForm from '../../../components/GroupForm';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../../context/account';

export default function AddGroup(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [agentChoices, setAgentChoices] = useState(null);
	const [error, setError] = useState();
	const { groups } = state;

	async function fetchAgents() {
		API.getGroups({ resourceSlug }, dispatch, setError, router);
		await API.getAgents({ resourceSlug }, setAgentChoices, setError, router);
	}

	useEffect(() => {
		if (groups == null || agentChoices == null) {
			fetchAgents();
		}
	}, [resourceSlug]);
	
	if (groups == null || agentChoices == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`New Group - ${teamName}`}</title>
		</Head>

		<GroupForm agentChoices={agentChoices?.agents} fetchAgents={fetchAgents} />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
