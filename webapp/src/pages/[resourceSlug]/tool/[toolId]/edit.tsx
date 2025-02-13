import * as API from '@api';
import Spinner from 'components/Spinner';
import ToolForm from 'components/tools/ToolForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function EditTool(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { tool, revisions, datasources } = state;

	function fetchTool() {
		API.getTool(
			{
				resourceSlug: resourceSlug,
				toolId: router.query.toolId
			},
			dispatch,
			setError,
			router
		);
	}

	useEffect(() => {
		fetchTool();
	}, [resourceSlug]);

	if (!tool) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Edit Tool - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900'>Edit Tool</h3>
			</div>

			<ToolForm
				setDisplayScreen={() => {}}
				fetchTools={() => {}}
				setActiveTab={() => {}}
				tool={tool}
				datasources={datasources}
				editing={true}
				revisions={revisions}
				fetchFormData={fetchTool}
				initialType={null}
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
