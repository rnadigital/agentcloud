import * as API from '@api';
import { CubeIcon, PlusIcon } from '@heroicons/react/20/solid';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import CreateVariableModal from 'components/variables/CreateVariableModal';
import VariableTable from 'components/variables/VariableTable';
import { useAccountContext } from 'context/account';
import { CirclePlus } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function Variables(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { variables } = state;
	const filteredVariables = variables?.filter(x => !x.hidden);
	const [createVariableOpen, setCreateVariableOpen] = useState(false);

	async function fetchVariables() {
		await API.getVariables({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVariables();
	}, [resourceSlug]);

	if (!variables) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Variables - ${teamName}`}</title>
			</Head>

			<div className='flex justify-between'>
				<h1 className='font-semibold text-2xl text-foreground'>Variables</h1>

				<button
					onClick={() => setCreateVariableOpen(true)}
					className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'>
					<CirclePlus width={14} />
					<p className='font-semibold text-sm'>New Variable</p>
				</button>
			</div>

			<VariableTable variables={filteredVariables} fetchVariables={fetchVariables} />

			{variables.length === 0 && (
				<NewButtonSection
					link={`/${resourceSlug}/variable/add`}
					emptyMessage={'No variables'}
					message={'Get started by adding variables.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'Add Variable'}
				/>
			)}
			<CreateVariableModal
				open={createVariableOpen}
				setOpen={setCreateVariableOpen}
				callback={() => {
					fetchVariables();
					setCreateVariableOpen(false);
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
