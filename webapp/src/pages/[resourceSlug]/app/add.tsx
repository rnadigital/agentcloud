import * as API from '@api';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import ChatAppForm from 'components/ChatAppForm';
import ChatAppForm2 from 'components/ChatAppForm2';
import CrewAppForm from 'components/CrewAppForm';
import CrewAppForm2 from 'components/CrewAppForm2';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import { useThemeContext } from 'context/themecontext';
import { AppsDataReturnType } from 'controllers/app';
import { Button } from 'modules/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from 'modules/components/ui/sheet';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { ReactSVG } from 'react-svg';

const chatAppTaglines = [
	'Build single agent chat bots (like GPTS)',
	'Integrate RAG datasources',
	'Add custom agent',
	'Integrate custom tools',
	'Embed your chat app via IFrame'
];

const processAppTaglines = [
	'Build Multi-Agent Process Apps (powered by Crew AI)',
	'Integrate RAG datasources',
	'Add custom code tools',
	'Add tasks',
	'Embed your process app via IFrame'
];

export default function AddApp(props: AppsDataReturnType) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<AppsDataReturnType>(props);
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const { step, setStep }: any = useStepContext();
	const [loading, setLoading] = useState(true);
	const { apps, tools, agents, tasks, models, datasources, teamMembers, variables } = state;

	const [moalOpen, setModalOpen] = useState(false);
	const { theme } = useThemeContext();

	async function fetchAppFormData() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	async function fetchEditData(appId) {
		await API.getApp({ resourceSlug, appId }, setCloneState, setError, router);
	}

	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	useEffect(() => {
		if (typeof location != undefined) {
			const appId = new URLSearchParams(location.search).get('appId');
			if (appId) {
				fetchEditData(appId);
			}
		}
	}, []);

	useEffect(() => {
		if (cloneState) {
			if (cloneState?.app?.type === 'chat') {
				setStep(1);
			}
			if (cloneState?.app?.type === 'crew') {
				setStep(2);
			}
		}
	}, [cloneState]);

	const handleCreateChatApp = () => {
		setStep(1);
	};

	const handleCreateProcessApp = () => {
		setStep(2);
	};

	useEffect(() => {
		if (typeof location != undefined) {
			const appId = new URLSearchParams(location.search).get('appId');
			if (
				(appId && state?.apps && (cloneState?.app?.crew || cloneState?.app?.type === 'chat')) ||
				(!appId && state?.apps)
			) {
				setLoading(false);
			}
		}
	}, [state?.apps, cloneState?.app]);

	if (loading) {
		return <Spinner />;
	}

	const renderStepContent = () => {
		switch (step) {
			case 0:
				return (
					<div>
						<h1 className='text-gray-900 font-semibold text-xl sm:text-2xl dark:text-white'>
							Build Intelligent Chat and Process Apps
						</h1>
						<h2 className='text-gray-400 text-sm sm:text-base mt-2 dark:text-gray-50'>
							Easily Build Intelligent Chat and Process Apps to Streamline Your Workflow
						</h2>
						<div className='md:flex gap-8 w-full mt-10'>
							<div className='flex-1 border border-gray-200 dark:border-slate-700 p-4 rounded-md group dark:bg-slate-800'>
								<img
									src={
										theme === 'dark'
											? '/images/get-started/create-chat-app-dark.jpg'
											: '/images/get-started/create-chat-app.png'
									}
								/>
								<div className='flex flex-col md:flex-row border-t border-gray-200 dark:border-slate-700 pt-4'>
									<div className='flex'>
										<img
											src='/images/get-started/chat-app-square.png'
											className='aspect-square h-12'
										/>
										<div className='ml-2'>
											<div className='text-lg font-semibold text-gray-900 dark:text-white'>
												Chat App
											</div>
											<div className='text-gray-500 max-w-sm dark:text-gray-50'>
												Build your chat app effortlessly with intelligent agents handling
												conversations
											</div>
										</div>
									</div>

									<Button
										className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white rounded-lg mt-2 md:mt-0'
										onClick={handleCreateChatApp}
									>
										+ Create
									</Button>
								</div>
								<div className='flex flex-col md:flex-row gap-4 flex-wrap mt-4'>
									{chatAppTaglines.map((tagline, index) => (
										<TagLine key={index} tagline={tagline} />
									))}
								</div>
							</div>

							<div className='flex-1 border border-gray-200 dark:border-slate-700 p-4 rounded-md group dark:bg-slate-800'>
								<img
									src={
										theme === 'dark'
											? '/images/get-started/create-process-app-dark.jpg'
											: '/images/get-started/create-process-app.png'
									}
								/>
								<div className='flex flex-col md:flex-row border-t border-gray-200 dark:border-slate-700 pt-4'>
									<div className='flex'>
										<img
											src='/images/get-started/process-app-square.png'
											className='aspect-square h-12'
										/>
										<div className='ml-2'>
											<div className='text-lg font-semibold text-gray-900 dark:text-white'>
												Process App
											</div>
											<div className='text-gray-500 max-w-sm dark:text-gray-50'>
												Effortlessly organize tasks and automate them with intelligent agents.
											</div>
										</div>
									</div>

									<Button
										className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white rounded-lg mt-2 md:mt-0'
										onClick={handleCreateProcessApp}
									>
										+ Create
									</Button>
								</div>
								<div className='flex flex-col md:flex-row gap-4 flex-wrap mt-4'>
									{processAppTaglines.map((tagline, index) => (
										<TagLine key={index} tagline={tagline} />
									))}
								</div>
							</div>
						</div>
					</div>
				);
			case 1:
				return (
					<ChatAppForm2
						fetchFormData={fetchAppFormData}
						agentChoices={agents}
						modelChoices={models}
						toolChoices={tools}
						app={cloneState?.app}
						whiteListSharingChoices={teamMembers}
						variableChoices={variables}
					/>
				);
			case 2:
				return (
					<CrewAppForm2
						agentChoices={agents}
						taskChoices={tasks}
						modelChoices={models}
						fetchFormData={fetchAppFormData}
						app={cloneState?.app}
						crew={cloneState?.app?.crew}
						variableChoices={variables}
						whiteListSharingChoices={teamMembers}
						toolChoices={tools}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<Head>
				<title>{`New App - ${teamName}`}</title>
			</Head>

			{renderStepContent()}
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

const TagLine = ({ tagline }: { tagline: string }) => {
	return (
		<div className='flex text-gray-900 items-center p-1 bg-primary-50 rounded gap-1 w-fit dark:bg-gray-600 dark:text-white'>
			<CheckBadgeIcon className='h-6 w-6' />
			<div>{tagline}</div>
		</div>
	);
};
