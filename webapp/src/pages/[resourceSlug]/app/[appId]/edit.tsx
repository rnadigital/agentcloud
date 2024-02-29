import * as API from '@api';
import { ChevronLeftIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import AppForm from 'components/AppForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function EditApp(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { app, agents, tasks, tools } = state;

	async function fetchAppFormData() {
		API.getApp({
			resourceSlug,
			appId: router.query.appId,
		}, dispatch, setError, router);
	}
	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	if (app == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Edit App - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2 mb-6'>
			<h3 className='font-semibold text-gray-900'>Edit App</h3>
		</div>

		<AppForm editing={true} app={app} crew={app?.crew} agentChoices={agents} taskChoices={tasks} fetchFormData={fetchAppFormData} />

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
