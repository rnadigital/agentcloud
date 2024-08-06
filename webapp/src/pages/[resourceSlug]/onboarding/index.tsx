import * as API from '@api';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import OnboardingSelect from 'components/onboarding/OnboardingSelect';
import { useAccountContext } from 'context/account';
import { useThemeContext } from 'context/themecontext';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface FormValues {
	role: { label: string; value: string };
}

export default function Onboarding() {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { csrf } = accountContext;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

	const { theme } = useThemeContext();

	useEffect(() => {
		refreshAccountContext();
	}, []);

	const { control, handleSubmit } = useForm<FormValues>({
		defaultValues: {
			role: null
		}
	});

	const onSubmit = async (data: FormValues) => {
		posthog.capture('onboarding', {
			role: data.role.value
		});
		await API.updateRole(
			{
				resourceSlug,
				role: data.role.value,
				_csrf: csrf
			},
			null,
			null,
			router
		);
	};

	return (
		<main className='flex items-center flex-col justify-center flex-1 dark:bg-gray-900'>
			<img
				src={
					theme === 'dark'
						? '/images/agentcloud-full-white-bg-trans.png'
						: '/images/agentcloud-full-black-bg-trans.png'
				}
				alt='Agentcloud'
				className='h-14 md:h-20'
			/>
			<section className='bg-white w-full max-w-[950px] rounded-lg shadow-sm p-8 flex flex-col gap-5 dark:bg-gray-700'>
				<h1 className='font-bold text-xl md:text-2xl dark:text-white'>Welcome to AgentCloud! 🎉</h1>
				<div className='text-gray-600 text-lg sm:text-xl dark:text-gray-50'>
					Let&apos;s begin by getting to know your role.
				</div>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='flex flex-col gap-4 text-lg sm:text-2xl items-center'
				>
					<div className='flex flex-col sm:flex-row gap-2 w-full sm:items-center'>
						<p className='w-fit font-extrabold dark:text-gray-50'>I am a</p>
						<div className='w-fit'>
							<OnboardingSelect<FormValues>
								options={[
									{ value: 'developer', label: 'Developer' },
									{ value: 'data_engineer', label: 'Data Engineer' },
									{ value: 'business_user', label: 'Business User' }
								]}
								classNames={{
									listboxButton: 'border-none text-lg sm:text-xl font-bold',
									listboxOptions: 'left-0 sm:text-lg'
								}}
								control={control}
								name='role'
								placeholder='Select your role'
							/>
						</div>
					</div>
					<hr className='my-4 w-full border-gray-200' />
					<button
						className='ml-auto h-10 w-24 disabled:bg-primary-200 bg-primary-500 text-white rounded-lg flex justify-center items-center text-sm'
						type='submit'
					>
						<>
							<span className='text-sm'>Next</span>
							<ChevronRightIcon className='ml-2 h-5 w-5' />
						</>
					</button>
				</form>
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
