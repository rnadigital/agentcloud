import * as API from '@api';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import InputField from 'components/form/InputField';
import DataSourceConfigSteps from 'components/onboarding/DataSourceConfigSteps';
import DataSourceDetails from 'components/onboarding/DataSourceDetails';
import DataSourceGrid from 'components/onboarding/DataSourceGrid';
import DataSourceOnboardingSteps from 'components/onboarding/DataSourceOnboardingSteps';
import DataSourceSearch from 'components/onboarding/DataSourceSearch';
import LeftFrame from 'components/onboarding/LeftFrame';
import OnboardingSelect from 'components/onboarding/OnboardingSelect';
import { error } from 'console';
import { useAccountContext } from 'context/account';
import OnboardingFormContext from 'context/onboardingform';
import { useThemeContext } from 'context/themecontext';
import cn from 'lib/cn';
import passwordPattern from 'misc/passwordpattern';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RegisterFormValues } from 'pages/register';
import { usePostHog } from 'posthog-js/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Connector } from 'struct/connector';

export default function Onboarding() {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { csrf } = accountContext;
	const router = useRouter();
	const { resourceSlug } = router.query;

	const [connectors, setConnectors] = useState([]);
	const [searchInput, setSearchInput] = useState<string>();
	const [currentStep, setCurrentStep] = useState(1);

	const filteredConnectors: Connector[] = useMemo(() => {
		return Array.from(new Set(connectors.map(connector => connector.name.toLowerCase())))
			.map(name => connectors.find(connector => connector.name.toLowerCase() === name))
			.filter(connector => connector.name.toLowerCase().includes(searchInput?.toLowerCase() || ''));
	}, [connectors, searchInput]);

	const [error, setError] = useState<string>();

	const initConnectors = async () => {
		try {
			await API.getConnectors(
				{
					resourceSlug
				},
				async res => {
					const connectorsJson = res?.sourceDefinitions;
					if (!connectorsJson || !connectorsJson?.length) {
						throw new Error('Falied to fetch connector list, please ensure Airbyte is running.');
					}
					setConnectors(connectorsJson);
				},
				err => {
					setError('Falied to fetch connector list, please ensure Airbyte is running.');
				},
				null
			);
		} catch (e) {
			console.error(e);
			setError(e?.message || e);
		}
	};

	useEffect(() => {
		initConnectors();
		refreshAccountContext();
	}, []);

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
						<OnboardingFormContext>
							{currentStep === 0 && (
								<>
									<DataSourceSearch searchInput={searchInput} setSearchInput={setSearchInput} />
									<DataSourceGrid connectors={filteredConnectors} />
								</>
							)}

							{currentStep === 1 && (
								<>
									<DataSourceDetails />
								</>
							)}
						</OnboardingFormContext>
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
