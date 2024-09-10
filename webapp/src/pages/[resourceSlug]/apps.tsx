import { PlusIcon } from '@heroicons/react/20/solid';
import AppCard from 'components/AppCard';
import ErrorAlert from 'components/ErrorAlert';
import SessionVariableModal from 'components/modal/SessionVariableModal';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import { AppsDataReturnType } from 'controllers/app';
import { ObjectId } from 'mongodb';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { App } from 'struct/app';

import * as API from '../../api';
import { useAccountContext } from '../../context/account';

export default function Apps(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { teamName, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<AppsDataReturnType>(props);
	const [error, setError] = useState();
	const { apps } = state;
	const filteredApps = apps?.filter(x => !x.hidden);
	const [sessionVariableOpen, setSessionVariableOpen] = useState(false);
	const [selectedApp, setSelectedApp] = useState<App>(null);

	const handleStartSession = async appId => {
		const app = apps.find(app => app._id === appId);
		setSelectedApp(app);

		if (app?.variables?.length > 0) {
			setSessionVariableOpen(true);
		} else {
			startSession(appId);
		}
	};

	async function startSession(appId: ObjectId, variables?: { [key: string]: string }) {
		await API.addSession(
			{
				_csrf: csrf,
				resourceSlug,
				id: appId,
				variables
			},
			null,
			setError,
			router
		);
	}

	async function fetchApps() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchApps();
		refreshAccountContext();
	}, [resourceSlug]);

	if (!apps) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Apps - ${teamName}`}</title>
			</Head>

			<PageTitleWithNewButton
				list={filteredApps}
				title='Apps'
				buttonText='New App'
				href='/app/add'
			/>

			{error && <ErrorAlert error={error} />}

			{apps.length === 0 && (
				<NewButtonSection
					link={`/${resourceSlug}/app/add`}
					emptyMessage={'No apps'}
					icon={
						<svg
							className='mx-auto h-12 w-12 text-gray-400'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							aria-hidden='true'
						>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
								strokeWidth={1.5}
								stroke='currentColor'
								className='w-6 h-6'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z'
								/>
							</svg>
						</svg>
					}
					message={'Get started by creating an app.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'New App'}
				/>
			)}

			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 py-2'>
				{filteredApps.map((a, ai) => (
					<AppCard key={ai} app={a} startSession={handleStartSession} fetchFormData={fetchApps} />
				))}
			</div>

			{sessionVariableOpen && (
				<SessionVariableModal
					open={sessionVariableOpen}
					setOpen={setSessionVariableOpen}
					variables={selectedApp?.variables || []}
					onSubmit={async variables => {
						await startSession(selectedApp?._id, variables);
						setSessionVariableOpen(false);
					}}
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
}: {
	req: any;
	res: any;
	query: any;
	resolvedUrl: string;
	locale: string;
	locales: string[];
	defaultLocale: string;
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
