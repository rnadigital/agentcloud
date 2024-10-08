import Spinner from 'components/Spinner';
import VariableForm from 'components/variables/VariableForm';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../api';
import { useAccountContext } from '../../../context/account';

export default function AddVariable(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, variableId } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);

	async function fetchVariableFormData() {
		await API.getVariables({ resourceSlug, variableId }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVariableFormData();
	}, [resourceSlug]);

	useEffect(() => {
		setLoading(false);
	}, [state]);

	if (loading) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`New Variable - ${teamName}`}</title>
			</Head>

			<span className='sm:w-full md:w-1/2'>
				<VariableForm fetchVariableFormData={fetchVariableFormData} editing={false} />
			</span>
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
