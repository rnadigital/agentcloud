import * as API from '@api';
import { ChevronLeftIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import AppCard from 'components/AppCard';
import ChatAppForm from 'components/ChatAppForm';
import CrewAppForm from 'components/CrewAppForm';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { AppType } from 'struct/app';

export default function ViewApp(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { app, tools, agents, tasks, models, datasources } = state;

	async function startSession(appId) {
		await API.addSession(
			{
				_csrf: csrf,
				resourceSlug,
				id: appId
			},
			null,
			setError,
			router
		);
	}

	async function fetchAppFormData() {
		API.getApp(
			{
				resourceSlug,
				appId: router.query.appId
			},
			dispatch,
			setError,
			router
		);
	}
	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	if (app == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{app.name}</title>
			</Head>

			<AppCard app={app} startSession={startSession} fetchFormData={fetchAppFormData} />
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
