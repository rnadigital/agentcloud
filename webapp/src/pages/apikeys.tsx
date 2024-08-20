import { HomeIcon, PlusIcon } from '@heroicons/react/20/solid';
import { KeyIcon } from '@heroicons/react/24/outline';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../api';
import AgentList from '../components/AgentList';
import NewButtonSection from '../components/NewButtonSection';
import { useAccountContext } from '../context/account';

export default function APIKeys(props) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const { resourceSlug } = router.query;
	const [loading, setLoading] = useState(true);
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { keys } = state;
	function fetchKeys() {
		API.getKeys({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchKeys();
		setLoading(false);
	}, [state]);

	console.log('keys', keys);

	if (loading) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`keys - ${account?.name}`}</title>
			</Head>

			<PageTitleWithNewButton
				list={keys}
				title='API Keys'
				buttonText='New Key'
				href='/apikey/add'
			/>
			{!keys && (
				<NewButtonSection
					link={`/apikey/add`}
					emptyMessage={'No keys'}
					icon={<KeyIcon className='mx-auto w-12 h-12 text-gray-500' />}
					message={'Get started by creating a new key.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'New Key'}
				/>
			)}
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
