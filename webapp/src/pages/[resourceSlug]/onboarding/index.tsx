import LLMConfigurationForm from 'components/onboarding/LLMConfigurationForm';
import React from 'react';

const Onboarding = () => {
	return (
		<main className='flex items-center flex-col'>
			<img
				src='/images/agentcloud-full-black-bg-trans.png'
				alt='Agentcloud'
				className='mb-5 h-14 md:h-20'
			/>
			<section className='bg-white w-full max-w-[950px] rounded-lg shadow-sm p-8' >
				<h1 className='font-bold text-xl md:text-2xl'>Welcome to AgentCloud! 🎉</h1>
				<div className='flex mt-5'>
					<img 
						src='/images/onboarding/brain.png'
						alt='Brain'
						className='h-8 w-8 md:h-20 md:w-20 mr-4'
					/>
					<p className='text-gray-700 text-sm md:text-base'>
                        The AI model you choose will be the brain of your app, interpreting data and generating responses. Different models excel in different areas, so pick the one that best matches your project&apos;s needs.  Read more about them. {' '}
						<a className='inline-block text-indigo-500' href='#' target='_blank' rel='noreferrer'>Read more about them</a>
					</p>
				</div>

				<LLMConfigurationForm/>
			</section>
		</main>
	);
};

export default Onboarding;