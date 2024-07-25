import { CheckBadgeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';

const GetStarted = () => {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, teamName, csrf } = accountContext as any;
	const { step, setStep } = useStepContext();
	const router = useRouter();

	const { resourceSlug } = router.query;

	const handleCreateChatApp = () => {
		setStep(1);
		router.push(`/${resourceSlug}/app/add`);
	};

	const handleCreateProcessApp = () => {
		setStep(2);
		router.push(`/${resourceSlug}/app/add`);
	};

	return (
		<>
			<Head>
				<title>Get Started - ${teamName}</title>
			</Head>
			<div>
				<h1 className='text-gray-900 font-semibold text-xl'>
					Build Intelligent Chat and Process Apps
				</h1>
				<h2 className='text-gray-400 '>
					Easily Build Intelligent Chat and Process Apps to Streamline Your Workflow
				</h2>
				<div className='md:flex gap-8 w-full'>
					<div className='flex-1'>
						<img
							src='/images/get-started/create-chat-app.png'
							alt='Create Chat App'
							// className='w-full sm:w-1/2 lg:w-1/3'
						/>
						<div className='flex flex-col md:flex-row'>
							<div className='flex'>
								<img src='/images/get-started/chat-app-square.png' className='aspect-square h-12' />
								<div>
									<div className='text-lg font-semibold text-gray-900'>Chat App</div>
									<div className='text-gray-500 max-w-sm'>
										Build your chat app effortlessly with intelligent agents handling conversations
									</div>
								</div>
							</div>

							<button
								className='w-full md:w-24 h-9 disabled:bg-primary-200 bg-primary-500 text-white rounded-lg flex justify-center items-center text-sm mt-4 md:mt-auto max-w-sm'
								onClick={handleCreateChatApp}
							>
								+ Create
							</button>
						</div>
						<div className='flex flex-col md:flex-row gap-4 flex-wrap mt-4'>
							<div className='flex text-gray-900 items-center p-1 bg-primary-50 rounded gap-1 w-fit'>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Build customized response bot</div>
							</div>

							<div className='flex text-gray-900 items-center p-1 bg-primary-50 rounded gap-1 w-fit'>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Integrate dynamic tools</div>
							</div>
						</div>
					</div>

					<div className='flex-1'>
						<img src='/images/get-started/create-process-app.png' alt='Create Process App' />
						<div className='flex flex-col md:flex-row'>
							<div className='flex'>
								<img
									src='/images/get-started/process-app-square.png'
									className='aspect-square h-12'
								/>
								<div>
									<div className='text-lg font-semibold text-gray-900'>Process App</div>
									<div className='text-gray-500 max-w-sm'>
										Effortlessly organize tasks and automate them with intelligent agents.
									</div>
								</div>
							</div>

							<button
								className='w-full md:w-24 h-9 disabled:bg-primary-200 bg-primary-500 text-white rounded-lg flex justify-center items-center text-sm mt-4 md:mt-auto max-w-sm'
								onClick={handleCreateProcessApp}
							>
								+ Create
							</button>
						</div>

						<div className='flex flex-col md:flex-row gap-4 flex-wrap mt-4'>
							<div className='flex text-gray-900 items-center p-1 bg-primary-50 rounded gap-1 w-fit'>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Build customized response bot</div>
							</div>

							<div className='flex text-gray-900 items-center p-1 bg-primary-50 rounded gap-1 w-fit'>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Integrate dynamic tools</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default GetStarted;
