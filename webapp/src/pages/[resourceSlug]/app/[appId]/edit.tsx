import * as API from '@api';
import { ChevronLeftIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import ChatAppForm2 from 'components/ChatAppForm2';
import CrewAppForm from 'components/CrewAppForm';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { AppType } from 'struct/app';
import { Button } from 'modules/components/ui/button';

export default function EditApp(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [emailState, setEmailState] = useState(null);
	const [error, setError] = useState();
	const { app, tools, agents, tasks, models, datasources, teamMembers, variables } = state;

	async function fetchAppFormData() {
		API.getApp(
			{
				resourceSlug,
				appId: router.query.appId
			},
			dispatch,
			setError,
			router
		);
	}
	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	const handleBack = () => {
		router.push(`/${resourceSlug}/apps`);
	};

	if (app == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Edit App - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2 mb-6 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Button variant='ghost' className='hover:bg-transparent p-0' onClick={handleBack}>
						<ChevronLeftIcon className='h-6 w-6' />
					</Button>
					<h3 className='font-semibold text-gray-900'>Edit App - {app.name}</h3>
				</div>
			</div>

			{(app.type as AppType) === AppType.CHAT ? (
				<ChatAppForm2
					editing={true}
					app={app}
					fetchFormData={fetchAppFormData}
					// datasourceChoices={datasources}
					agentChoices={agents}
					modelChoices={models}
					// taskChoices={tasks}
					toolChoices={tools}
					whiteListSharingChoices={teamMembers}
					variableChoices={variables}
					callback={() => {
						router.push(`/${resourceSlug}/apps`);
					}}
				/>
			) : (
				<CrewAppForm
					editing={true}
					app={app}
					crew={app?.crew}
					fetchFormData={fetchAppFormData}
					// datasourceChoices={datasources}
					agentChoices={agents}
					modelChoices={models}
					taskChoices={tasks}
					whiteListSharingChoices={teamMembers}
					// toolChoices={tools}
					variableChoices={variables}
					callback={() => {
						router.push(`/${resourceSlug}/apps`);
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
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
