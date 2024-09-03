import dynamic from 'next/dynamic';
const CreateDatasourceForm = dynamic(() => import('components/CreateDatasourceForm'), {
	ssr: false
});
import * as API from 'api';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function AddDatasource(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [models, setModels] = useState();
	const [spec, setSpec] = useState(null);

	async function fetchDatasourceFormData() {
		await API.getModels({ resourceSlug }, res => setModels(res?.models), setError, router);
	}

	useEffect(() => {
		fetchDatasourceFormData();
	}, [resourceSlug]);

	if (models == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`New Datasource - ${teamName}`}</title>
			</Head>

			<div className='pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900'>New Datasource</h3>
			</div>

			<CreateDatasourceForm
				models={models}
				spec={spec}
				setSpec={setSpec}
				fetchDatasourceFormData={fetchDatasourceFormData}
				initialStep={2}
			/>
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
