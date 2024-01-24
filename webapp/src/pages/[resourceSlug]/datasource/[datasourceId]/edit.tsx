import * as API from '@api';
import DatasourceForm from 'components/DatasourceForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function EditDatasource(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { datasource } = state;

	async function fetchDatasource() {
		await API.getDatasource({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchDatasource();
	}, [resourceSlug]);
	
	if (datasource == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Edit Datasource - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Edit Datasource</h3>
		</div>

		<DatasourceForm />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
