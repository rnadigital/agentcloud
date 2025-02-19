import DataSourceConfigSteps from 'components/connections/DataSourceConfigSteps';
import DataSourceDetails from 'components/connections/DataSourceDetails';
import DataSourceGrid from 'components/connections/DataSourceGrid';
import DataSourceSearch from 'components/connections/DataSourceSearch';
import DatasourceStreamConfiguration from 'components/connections/DatasourceStreamConfiguration';
import DatasourceSyncing from 'components/connections/DatasourceSyncing';
import EmbeddingModelSelect from 'components/connections/EmbeddingModelSelect';
import VectorDBSelection from 'components/connections/VectorDBSelection';
import { useAccountContext } from 'context/account';
import OnboardingFormContext from 'context/onboardingform';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useDatasourceStore } from 'store/datasource';
import { useShallow } from 'zustand/react/shallow';

export default function AddConnection() {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { csrf } = accountContext;
	const router = useRouter();

	const { currentStep, currentDatasourceStep, initConnectors, setStore, resourceSlug } =
		useDatasourceStore(
			useShallow(state => ({
				currentStep: state.currentStep,
				currentDatasourceStep: state.currentDatasourceStep,
				initConnectors: state.initConnectors,
				setStore: state.setStore,
				resourceSlug: state.resourceSlug
			}))
		);

	useEffect(() => {
		if (resourceSlug) {
			initConnectors(router);
			refreshAccountContext();
		}
	}, [resourceSlug]);

	useEffect(() => {
		if (router.query.resourceSlug) {
			setStore({
				resourceSlug: router.query.resourceSlug as string,
				csrf
			});
		}
	}, [router.query.resourceSlug, csrf]);

	return (
		<>
			<Head>
				<title>Register</title>
			</Head>

			<div className='flex flex-1 bg-white'>
				<main className='py-14 px-28 w-full'>
					<div className=''>
						{currentDatasourceStep <= 2 && currentStep < 2 && (
							<>
								<div className='text-2xl mb-4'>Select Data Source</div>
								<DataSourceConfigSteps />
							</>
						)}
					</div>

					<section className='mt-6 flex flex-col h-full'>
						<OnboardingFormContext>
							{currentDatasourceStep === 0 && (
								<>
									<DataSourceSearch />
									<DataSourceGrid />
								</>
							)}

							{currentDatasourceStep === 1 && <DatasourceStreamConfiguration />}

							{currentDatasourceStep === 2 && <DataSourceDetails />}

							{currentStep === 1 && <EmbeddingModelSelect />}
							{currentStep === 2 && <VectorDBSelection />}
							{currentStep === 3 && <DatasourceSyncing />}
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
