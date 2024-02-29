import * as API from '@api';
import AppForm from 'components/AppForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function AddApp(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { apps, tools, agents, tasks } = state;

	async function fetchAppFormData() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	if (apps == null) {
		return 'Loading...'; //TODO: Implement a better loading indicator
	}

	return (
		<>
			<Head>
				<title>{`New App - ${teamName}`}</title>
			</Head>

			<span className='sm:w-full md:w-1/2 xl:w-1/3'>
				<AppForm agentChoices={agents} taskChoices={tasks} fetchFormData={fetchAppFormData} />
			</span>
		</>
	);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
