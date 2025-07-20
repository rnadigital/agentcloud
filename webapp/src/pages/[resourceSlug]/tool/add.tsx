import * as API from '@api';
import Spinner from 'components/Spinner';
import ToolForm from 'components/tools/ToolForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function AddTool(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);
	const { tools, datasources } = state;

	function fetchTools() {
		API.getTools({ resourceSlug }, dispatch, setError, router);
	}

	function fetchEditData(toolId) {
		API.getTool({ resourceSlug, toolId }, setCloneState, setError, router);
	}

	useEffect(() => {
		fetchTools();
	}, [resourceSlug]);

	useEffect(() => {
		if (typeof location != undefined) {
			const toolId = new URLSearchParams(location.search).get('toolId');
			if (toolId) {
				fetchEditData(toolId);
			} else {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		if (cloneState != null) {
			setLoading(false);
		}
	}, [cloneState]);

	if (loading) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`New Tool - ${teamName}`}</title>
			</Head>

			{tools?.length > 0 && (
				<div className='border-b pb-2 my-2'>
					<h3 className='pl-2 font-semibold text-gray-900'>New Tool</h3>
				</div>
			)}

			<ToolForm
				setDisplayScreen={() => {}}
				fetchTools={() => {}}
				setActiveTab={() => {}}
				datasources={datasources}
				fetchFormData={fetchTools}
				initialType={cloneState?.tool?.type}
				tool={cloneState?.tool}
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
