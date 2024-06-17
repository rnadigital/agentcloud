import Spinner from 'components/Spinner';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../../api';
import ToolForm from '../../../../components/ToolForm';
import { useAccountContext } from '../../../../context/account';

export default function EditTool(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { tool, datasources } = state;

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
		return <Spinner />;
	}

	return (<>

		<Head>
			<title>{`Edit Tool - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Edit Tool</h3>
		</div>

		<ToolForm tool={tool} datasources={datasources} editing={true} />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
