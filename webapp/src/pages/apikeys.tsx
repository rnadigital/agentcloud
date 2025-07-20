import * as API from '@api';
import { KeyIcon } from '@heroicons/react/24/outline';
import ApiKeyList from 'components/ApiKeyList';
import CreateAPIKeyModal from 'components/CreateAPIKeyModal';
import NewButtonSection from 'components/NewButtonSection';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { CirclePlus, PlusIcon } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function APIKeys(props) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const [loading, setLoading] = useState(true);
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { keys } = state;
	const [createKeyOpen, setCreateKeyOpen] = useState(false);

	function fetchKeys(ownerId) {
		API.getKeys({ ownerId, _csrf: csrf }, dispatch, setError, router);
	}

	useEffect(() => {
		const ownerId = accountContext?.account?._id;
		fetchKeys(ownerId);
		setLoading(false);
	}, []);

	if (loading || keys === undefined) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`keys - ${account?.name}`}</title>
			</Head>

			<div className='flex justify-between'>
				<h1 className='font-semibold text-2xl text-foreground'>Variables</h1>

				<button
					onClick={() => setCreateKeyOpen(true)}
					className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'
				>
					<CirclePlus width={14} />
					<p className='font-semibold text-sm'>New Key</p>
				</button>
			</div>

			{keys?.length === 0 ? (
				<NewButtonSection
					setOpen={setCreateKeyOpen}
					emptyMessage={'No keys'}
					icon={<KeyIcon className='mx-auto w-12 h-12 text-gray-500' />}
					message={'Get started by creating a new key.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'New Key'}
				/>
			) : (
				<div>
					{
						//need to properly implement this
						<ApiKeyList keys={keys} fetchKeys={fetchKeys} />
					}
				</div>
			)}

			<CreateAPIKeyModal
				open={createKeyOpen}
				setOpen={setCreateKeyOpen}
				callback={() => {
					fetchKeys(account?._id);
					setCreateKeyOpen(false);
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
