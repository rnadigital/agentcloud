import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../api';
import { useAccountContext } from '../../context/account';

export default function Apps(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions } = state;

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
			<title>{`Apps - ${teamName}`}</title>
		</Head>

		Under construction...

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
