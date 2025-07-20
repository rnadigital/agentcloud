import Spinner from 'components/Spinner';
import VariableForm from 'components/variables/VariableForm';
import VectorDbForm from 'components/vectordbs/VectorDbForm';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../api';
import { useAccountContext } from '../../../context/account';

export default function AddVectorDb(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);

	async function fetchVectorDbFormData() {
		await API.getVectorDbs({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVectorDbFormData();
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
				<title>{`New Vector DB- ${teamName}`}</title>
			</Head>

			<span className='sm:w-full md:w-1/2'>
				<VectorDbForm fetchVectorDbFormData={fetchVectorDbFormData} editing={false} />
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
