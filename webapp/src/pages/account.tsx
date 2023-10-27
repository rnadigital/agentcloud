import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ErrorAlert from '../components/ErrorAlert';
import * as API from '../api';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';

export default function Account(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	// const { account } = state;

	useEffect(() => {
		if (!account) {
			API.getAccount(dispatch, setError, router);
		}
	}, []);
	
	if (!account) {
		return 'Loading...'; //TODO: loader
	}

	return (
		<>

			<Head>
				<title>Account</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			Welcome {state.account.email}

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
}
