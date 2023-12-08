import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../../api';
import ToolForm from '../../../components/ToolForm';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../../context/account';

export default function AddTool(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { tools, credentials } = state;

	function fetchTools() {
		API.getTools({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTools();
	}, [resourceSlug]);

	if (!tools) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`New Tool - ${teamName}`}</title>
		</Head>

		{tools.length > 0 && <div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>New Tool</h3>
		</div>}

		<ToolForm credentials={credentials} />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
