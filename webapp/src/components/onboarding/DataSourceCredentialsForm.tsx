import * as API from '@api';
import DynamicConnectorForm from 'components/connectorform/DynamicConnectorForm';
import { useAccountContext } from 'context/account';
import FormContext from 'context/connectorform';
import { useOnboardingFormContext } from 'context/onboardingform';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Connector } from 'struct/connector';

const DataSourceCredentialsForm = ({
	connector,
	setStep
}: {
	connector: Connector;
	setStep: Function;
}) => {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;

	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

	const { watch, setValue, register } = useOnboardingFormContext();

	const setStagedDatasource = datasource => {
		setValue('stagedDatasource', datasource);
	};

	const [spec, setSpec] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const datasourceName = watch('datasourceName');
	const datasourceDescription = watch('datasourceDescription');

	const getSpecification = async (sourceDefinitionId: string) => {
		API.getSpecification(
			{
				sourceDefinitionId,
				resourceSlug
			},
			spec => {
				posthog.capture('getSpecification', {
					sourceDefinitionId
				});
				setSpec(spec);
			},
			specError => {
				posthog.capture('getSpecification', {
					sourceDefinitionId,
					error: specError
				});
				setError(specError);
			},
			null
		);
		setLoading(false);
	};

	const datasourcePost = async (data?) => {
		setSubmitting(true);
		setError(null);
		const posthogEvent = 'testDatasource';
		try {
			const body = {
				sourceConfig: data,
				_csrf: csrf,
				connectorId: connector.sourceDefinitionId,
				connectorName: connector.name,
				resourceSlug,
				datasourceName,
				datasourceDescription
			};
			//step 2, getting schema and testing connection
			await API.testDatasource(
				body,
				stagedDatasource => {
					posthog.capture(posthogEvent, {
						datasourceName,
						connectorId: connector?.sourceDefinitionId,
						connectorName: connector?.name
					});
					if (stagedDatasource) {
						setStagedDatasource(stagedDatasource);
						setStep(1);
					} else {
						setError('Datasource connection test failed.'); //TODO: any better way to get error?
					}
				},
				res => {
					posthog.capture(posthogEvent, {
						datasourceName,
						connectorId: connector?.sourceDefinitionId,
						connectorName: connector?.name,
						error: res
					});
					setError(res);
				},
				router
			);
		} catch (e) {
			posthog.capture(posthogEvent, {
				datasourceName,
				connectorId: connector?.sourceDefinitionId,
				connectorName: connector?.name,
				error: e?.message || e
			});
			console.error(e);
		} finally {
			await new Promise(res => setTimeout(res, 750));
			setSubmitting(false);
		}
	};

	useEffect(() => {
		if (connector) {
			getSpecification(connector.sourceDefinitionId);
		}
	}, [connector]);

	return (
		<div className='w-full bg-primary-50 p-6 txt-gray-900 dark:text-slate-400 flex flex-col gap-2'>
			<div className='font-semibold'>Connect {connector.name}</div>
			<div>
				<label htmlFor='name' className='block text-sm leading-6'>
					Datasource Name<span className='text-red-700'> *</span>
				</label>
				<div>
					<input
						required
						type='text'
						name='name'
						id='name'
						className='block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600'
						value={datasourceName}
						{...register('datasourceName', {
							required: 'Name is required'
						})}
					/>
				</div>
			</div>
			<div>
				<label htmlFor='description' className='block text-sm leading-6'>
					Description<span className='text-red-700'> *</span>
				</label>
				<div>
					<input
						required
						type='text'
						name='description'
						id='description'
						className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						value={datasourceDescription}
						{...register('datasourceDescription', {
							required: 'Description is required'
						})}
					/>
				</div>
			</div>
			{spec?.schema && connector?.name && (
				<>
					<FormContext schema={spec.schema.connectionSpecification}>
						<DynamicConnectorForm
							schema={spec.schema.connectionSpecification}
							datasourcePost={datasourcePost}
							error={error}
						/>
					</FormContext>
				</>
			)}
		</div>
	);
};

export default DataSourceCredentialsForm;
