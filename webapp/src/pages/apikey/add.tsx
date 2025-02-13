import * as API from '@api';
import ApiKeyForm from 'components/apikeys/ApiKeyForm';
import Spinner from 'components/Spinner';
import ToolForm from 'components/tools/ToolForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function AddTool(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const [loading, setLoading] = useState(false);
	const { tools, datasources } = state;

	if (loading) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`New Key - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900'>New API Key</h3>
				<ApiKeyForm callback={() => {}} />
			</div>
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
