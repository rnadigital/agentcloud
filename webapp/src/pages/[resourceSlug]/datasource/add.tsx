import CreateDatasourceForm from 'components/CreateDatasourceForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../api';

export default function AddDatasource(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	return (<>

		<Head>
			<title>{`New Datasource - ${teamName}`}</title>
		</Head>

		<div className='pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>New Datasource</h3>
		</div>

		<CreateDatasourceForm />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
