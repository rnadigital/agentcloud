import * as API from '@api';
import Spinner from 'components/Spinner';
import VectorDbForm from 'components/vectordbs/VectorDbForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { VectorDbDocument } from 'struct/vectordb';

export default function EditVariable(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, vectorDbId } = router.query;
	const [vectorDb, setVectorDb] = useState<VectorDbDocument>(props.variable);
	const [error, setError] = useState();

	async function fetchVectorDbData() {
		await API.getVectorDb(
			{
				resourceSlug,
				vectorDbId
			},
			setVectorDb,
			setError,
			router
		);
	}

	useEffect(() => {
		fetchVectorDbData();
	}, [resourceSlug]);

	if (!vectorDb) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Edit Variable - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2 mb-6'>
				<h3 className='font-semibold text-gray-900'>Edit Variable</h3>
			</div>

			<span className='sm:w-full md:w-1/2'>
				<VectorDbForm
					vectorDb={vectorDb}
					fetchVectorDbFormData={fetchVectorDbData}
					editing={true}
				/>
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
