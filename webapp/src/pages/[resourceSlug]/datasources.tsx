import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import * as API from '../../api';
import { useAccountContext } from '../../context/account';
import DatasourceCards from '../../components/DatasourceCards';
import { useRouter } from 'next/router';

export default function Datasources(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { datasources } = state;

	async function fetchDatasources() {
		await API.getDatasources({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchDatasources();
	}, [resourceSlug]);

	if (!datasources) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Datasources - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Datasources</h3>
		</div>      

		<DatasourceCards datasources={datasources} fetchDatasources={fetchDatasources} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
