import * as API from '@api';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import InputField from 'components/form/InputField';
import DataSourceConfigSteps from 'components/onboarding/DataSourceConfigSteps';
import DataSourceGrid from 'components/onboarding/DataSourceGrid';
import DataSourceOnboardingSteps from 'components/onboarding/DataSourceOnboardingSteps';
import DataSourceSearch from 'components/onboarding/DataSourceSearch';
import LeftFrame from 'components/onboarding/LeftFrame';
import OnboardingSelect from 'components/onboarding/OnboardingSelect';
import { error } from 'console';
import { useAccountContext } from 'context/account';
import { useThemeContext } from 'context/themecontext';
import cn from 'lib/cn';
import passwordPattern from 'misc/passwordpattern';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RegisterFormValues } from 'pages/register';
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
		<>
			<Head>
				<title>Register</title>
			</Head>

			<div className='flex flex-1 bg-white'>
				<LeftFrame>
					<div className='flex h-full flex-col'>
						<DataSourceOnboardingSteps currentStep={0} />
					</div>
				</LeftFrame>

				<main className='py-14 px-28 w-full'>
					<div className=''>
						<div className='text-2xl mb-4'>Select Data Source</div>
						<DataSourceConfigSteps currentStep={0} />
					</div>

					<section className='mt-6'>
						<DataSourceSearch />
						<DataSourceGrid />
					</section>
				</main>
			</div>
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
