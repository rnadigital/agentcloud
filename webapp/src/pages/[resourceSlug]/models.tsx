import { PlusIcon } from '@heroicons/react/20/solid';
import * as API from 'api';
import CreateModelModal from 'components/CreateModelModal';
import ModelTable from 'components/ModelTable';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { CirclePlus } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function Models(props) {
	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { models } = state;
	const filteredModels = models?.filter(x => !x.hidden);
	const [createModelOpen, setCreateModelOpen] = useState(false);
	function fetchModels() {
		API.getModels({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchModels();
	}, [resourceSlug]);

	if (!models) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Models - ${teamName}`}</title>
			</Head>

			<div className='flex justify-between'>
				<h1 className='font-semibold text-2xl text-foreground'>Variables</h1>

				<button
					onClick={() => setCreateModelOpen(true)}
					className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'>
					<CirclePlus width={14} />
					<p className='font-semibold text-sm'>New Model</p>
				</button>
			</div>

			<ModelTable models={filteredModels} fetchModels={fetchModels} />

			{models.length === 0 && (
				<NewButtonSection
					setOpen={setCreateModelOpen}
					link={`/${resourceSlug}/model/add`}
					emptyMessage={'No models'}
					icon={
						<svg
							className='mx-auto h-12 w-12 text-gray-400'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							aria-hidden='true'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
								strokeWidth={1.5}
								stroke='currentColor'
								className='w-6 h-6'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z'
								/>
							</svg>
						</svg>
					}
					message={'Get started by adding a model.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'Add Model'}
				/>
			)}
			<CreateModelModal
				open={createModelOpen}
				setOpen={setCreateModelOpen}
				callback={() => {
					fetchModels();
					setCreateModelOpen(false);
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
