import * as API from '@api';
import DataSourceConfigSteps from 'components/onboarding/DataSourceConfigSteps';
import DataSourceDetails from 'components/onboarding/DataSourceDetails';
import DataSourceGrid from 'components/onboarding/DataSourceGrid';
import DataSourceOnboardingSteps from 'components/onboarding/DataSourceOnboardingSteps';
import DataSourceSearch from 'components/onboarding/DataSourceSearch';
import DatasourceStreamConfiguration from 'components/onboarding/DatasourceStreamConfiguration';
import DatasourceSyncing from 'components/onboarding/DatasourceSyncing';
import EmbeddingModelSelect from 'components/onboarding/EmbeddingModelSelect';
import LeftFrame from 'components/onboarding/LeftFrame';
import VectorDBSelection from 'components/onboarding/VectorDBSelection';
import { useAccountContext } from 'context/account';
import OnboardingFormContext from 'context/onboardingform';
import { defaultChunkingOptions } from 'misc/defaultchunkingoptions';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Connector } from 'struct/connector';
import submittingReducer from 'utils/submittingreducer';

export default function Onboarding() {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const router = useRouter();
	const { resourceSlug } = router.query;

	const [connectors, setConnectors] = useState([]);
	const [searchInput, setSearchInput] = useState<string>();
	const [currentStep, setCurrentStep] = useState(0);
	const [currentDatasourceStep, setCurrentDatasourceStep] = useState(0);

	const [streamState, setStreamReducer] = useReducer(submittingReducer, {});

	const [chunkingConfig, setChunkingConfig] = useReducer(submittingReducer, {
		...defaultChunkingOptions
	});

	const filteredConnectors: Connector[] = useMemo(() => {
		return Array.from(new Set(connectors.map(connector => connector.name.toLowerCase())))
			.map(name => connectors.find(connector => connector.name.toLowerCase() === name))
			.filter(connector => connector.name.toLowerCase().includes(searchInput?.toLowerCase() || ''));
	}, [connectors, searchInput]);

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
					console.error('Falied to fetch connector list, please ensure Airbyte is running.');
				},
				null
			);
		} catch (e) {
			console.error(e);
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
						<DataSourceOnboardingSteps currentStep={currentStep} />
					</div>
				</LeftFrame>

				<main className='py-14 px-28 w-full'>
					<div className=''>
						{currentDatasourceStep <= 2 && currentStep < 2 && (
							<>
								<div className='text-2xl mb-4'>Select Data Source</div>
								<DataSourceConfigSteps currentStep={currentDatasourceStep} />
							</>
						)}
					</div>

					<section className='mt-6 flex flex-col h-full'>
						<OnboardingFormContext>
							{currentDatasourceStep === 0 && (
								<>
									<DataSourceSearch searchInput={searchInput} setSearchInput={setSearchInput} />
									<DataSourceGrid
										connectors={filteredConnectors}
										setCurrentDatasourceStep={setCurrentDatasourceStep}
									/>
								</>
							)}

							{currentDatasourceStep === 1 && (
								<DatasourceStreamConfiguration
									setStreamReducer={setStreamReducer}
									submitting={false}
									setStep={setCurrentDatasourceStep}
								/>
							)}

							{currentDatasourceStep === 2 && (
								<DataSourceDetails
									streamState={streamState}
									setCurrentDatasourceStep={setCurrentDatasourceStep}
									setStep={setCurrentStep}
									chunkingConfig={chunkingConfig}
									setChunkingConfig={setChunkingConfig}
								/>
							)}

							{currentStep === 1 && <EmbeddingModelSelect setStep={setCurrentStep} />}
							{currentStep === 2 && (
								<VectorDBSelection
									streamState={streamState}
									chunkingConfig={chunkingConfig}
									setStep={setCurrentStep}
								/>
							)}
							{currentStep === 3 && <DatasourceSyncing />}
						</OnboardingFormContext>
					</section>
					{/* <div className='flex mt-6'>
						<button
							className={cn(
								'flex items-center gap-1',
								currentStep === 1 ? 'text-gray-500' : 'text-primary-500'
							)}
						>
							<ArrowLeftIcon className='h-4 w-4' />
							<span>Back</span>
						</button>
						<button className='flex ml-auto items-center gap-1 text-primary-500'>
							<ArrowRightIcon className='h-4 w-4' />
							<span>Next</span>
						</button>
					</div> */}
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
