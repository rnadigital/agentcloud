import { BrainIcon } from 'components/assets/BrainIcon';
import LLMConfigurationForm from 'components/onboarding/LLMConfigurationForm';
import { ThemeContext } from 'context/themecontext';
import React, { useContext } from 'react';

export default function ConfigureModels() {
	const { theme } = useContext(ThemeContext);
	return (
		<main className='flex items-center flex-col relative'>
			<img
				src={
					theme === 'dark'
						? '/images/agentcloud-full-white-bg-trans.png'
						: '/images/agentcloud-full-black-bg-trans.png'
				}
				alt='Agentcloud'
				className='mb-5 h-14 md:h-20'
			/>
			<section className='bg-white w-full max-w-[950px] rounded-lg shadow-sm p-8 dark:bg-gray-700'>
				<h1 className='font-bold text-xl md:text-2xl dark:text-white'>Welcome to AgentCloud! 🎉</h1>
				<div className='flex mt-5 w-full gap-x-4 sm:items-center'>
					<div className='dark:bg-gray-500 rounded-lg min-w-8 h-8 sm:min-w-16 sm:min-h-16 grid place-items-center bg-primary-50 text-indigo-500 dark:text-white'>
						<BrainIcon className='h-4 w-4 sm:h-8 sm:w-8' />
					</div>
					<p className='text-gray-700 text-sm md:text-base dark:text-gray-50 flex-shrink'>
						The AI model you choose will be the brain of your app, interpreting data and generating
						responses. Different models excel in different areas, so pick the one that best matches
						your project&apos;s needs.
					</p>
				</div>
				<LLMConfigurationForm />
			</section>
		</main>
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
