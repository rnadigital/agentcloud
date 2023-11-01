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
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { groups } = state;

	useEffect(() => {
		if (!groups) {
			API.getGroups({ resourceSlug: account.currentOrg }, dispatch, setError, router);
		}
	}, []);
	
	if (groups == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>New Group - {teamName}</title>
		</Head>

		<GroupForm />

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
}
