import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../api';
import StartSessionChatbox from '../../components/StartSessionChatbox';
import { useAccountContext } from '../../context/account';

export default function Playground(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions, crews, agents } = state;
	const [open, setOpen] = useState(false);

	async function fetchSessions() {
		await API.getSessions({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchSessions();
	}, [resourceSlug]);

	if (!sessions) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Playground - ${teamName}`}</title>
		</Head>

		Under construction...

		<StartSessionChatbox crews={crews} agents={agents} setOpen={setOpen} fetchSessions={fetchSessions} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
