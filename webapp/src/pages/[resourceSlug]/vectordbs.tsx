import * as API from '@api';
import { PlusIcon } from '@heroicons/react/20/solid';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import VectorDbTable from 'components/vectordbs/VectorDbTable';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function VectorDbs(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	console.log(state);
	const [error, setError] = useState();
	const { vectorDbs } = state;

	async function fetchVectorDbs() {
		await API.getVectorDbs({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVectorDbs();
	}, [resourceSlug]);

	if (!vectorDbs) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`VectorDbs- ${teamName}`}</title>
			</Head>

			<PageTitleWithNewButton
				list={vectorDbs}
				title='Vector Databases'
				buttonText='New Vector DB'
				href='/vectordb/add'
			/>

			<VectorDbTable vectorDbs={vectorDbs} fetchVectorDbs={fetchVectorDbs} />

			{vectorDbs.length === 0 && (
				<NewButtonSection
					link={`/${resourceSlug}/variable/add`}
					emptyMessage={'No vector databases'}
					message={'Get started by vector databases.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'Add Variable'}
				/>
			)}
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
