import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import LLMConfigurationForm from 'components/onboarding/LLMConfigurationForm';
import ThemeSelector from 'components/ThemeSelector';
import { ThemeContext } from 'context/themecontext';
import React, { useContext } from 'react';

export default function ConfigureModels() {
	const { theme } = useContext(ThemeContext);
	return (
		<main className='flex items-center flex-col relative'>
			<div className='absolute top-0 right-2'>
				<ThemeSelector />
			</div>
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
				<div className='flex mt-5'>
					<img
						src={
							theme === 'dark'
								? '/images/onboarding/brain-dark.png'
								: '/images/onboarding/brain.png'
						}
						alt='Brain'
						className='h-8 w-8 md:h-20 md:w-20 mr-4'
					/>
					<p className='text-gray-700 text-sm md:text-base dark:text-gray-50'>
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
