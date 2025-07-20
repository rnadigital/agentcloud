import * as API from '@api';
import { PlusIcon } from '@heroicons/react/20/solid';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import CreateVectorDbModal from 'components/vectordbs/CreateVectorDbModal';
import VectorDbTable from 'components/vectordbs/VectorDbTable';
import { useAccountContext } from 'context/account';
import { CirclePlus } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function VectorDbs(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { vectorDbs } = state;
	const [createVectorDbOpen, setCreateVectorDbOpen] = useState(false);

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

			<div className='flex justify-between'>
				<h1 className='font-semibold text-2xl text-foreground'>Variables</h1>

				<button
					onClick={() => setCreateVectorDbOpen(true)}
					className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'>
					<CirclePlus width={14} />
					<p className='font-semibold text-sm'>New Vector DB</p>
				</button>
			</div>

			<VectorDbTable vectorDbs={vectorDbs} fetchVectorDbs={fetchVectorDbs} />

			{vectorDbs.length === 0 && (
				<NewButtonSection
					setOpen={() => {}}
					link={`/${resourceSlug}/vectordb/add`}
					emptyMessage={'No vector databases'}
					message={'Get started by vector databases.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'Add Vector DB'}
				/>
			)}

			<CreateVectorDbModal
				open={createVectorDbOpen}
				setOpen={setCreateVectorDbOpen}
				callback={() => {
					fetchVectorDbs();
					setCreateVectorDbOpen(false);
				}}
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
