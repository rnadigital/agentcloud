import * as API from '@api';
import AppForm from 'components/AppForm';
import AppForm2 from 'components/AppForm2';
import Spinner from 'components/Spinner';
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
	const { apps, tools, agents, tasks, models } = state;

	async function fetchAppFormData() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	if (apps == null) {
		return <Spinner/>;
	}

	return (
		<>
			<Head>
				<title>{`New App - ${teamName}`}</title>
			</Head>

			<AppForm2
				agentChoices={agents}
				taskChoices={tasks}
					// toolChoices={tools}
				modelChoices={models}
				fetchFormData={fetchAppFormData}
			/>
		</>
	);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
