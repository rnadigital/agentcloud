import * as API from '@api';
import ModelForm from 'components/ModelForm';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function EditModel(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, modelId } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { model } = state;

	async function fetchModelFormData() {
		await API.getModel(
			{
				resourceSlug,
				modelId
			},
			dispatch,
			setError,
			router
		);
	}

	useEffect(() => {
		fetchModelFormData();
	}, [resourceSlug]);

	if (model == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Edit Model - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2 mb-6'>
				<h3 className='font-semibold text-gray-900 dark:text-white'>Edit Model</h3>
			</div>

			<span className='sm: w-full md:w-1/2 xl:w-1/3'>
				<ModelForm _model={model} fetchModelFormData={fetchModelFormData} editing={true} />
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
