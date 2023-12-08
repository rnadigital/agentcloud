import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../../../api';
import ToolForm from '../../../../components/ToolForm';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../../../context/account';

export default function EditTool(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { tool, credentials } = state;

	function fetchTools() {
		API.getTool({
			resourceSlug: resourceSlug,
			agentId: router.query.agentId,
		}, dispatch, setError, router);
	}
	
	useEffect(() => {
		fetchTools();
	}, [resourceSlug]);

	if (!tool) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Edit Tool - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Edit Tool</h3>
		</div>

		<ToolForm tool={tool} credentials={credentials} editing={true} />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
