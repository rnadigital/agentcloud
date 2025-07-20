import * as API from '@api';
import DynamicConnectorForm from 'components/connectorform/DynamicConnectorForm';
import FormContext from 'context/connectorform';
import { useOnboardingFormContext } from 'context/onboardingform';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { use, useEffect, useState } from 'react';
import { useDatasourceStore } from 'store/datasource';
import { Connector } from 'struct/connector';
import { useShallow } from 'zustand/react/shallow';

const DataSourceCredentialsForm = ({ connector }: { connector: Connector }) => {
	const { watch, setValue, register } = useOnboardingFormContext();
	const router = useRouter();
	const posthog = usePostHog();

	const { spec, error, getSpecification, datasourcePost, stagedDatasource } = useDatasourceStore(
		useShallow(state => ({
			spec: state.spec,
			error: state.error,
			loading: state.loading,
			getSpecification: state.getSpecification,
			datasourcePost: state.datasourcePost,
			stagedDatasource: state.stagedDatasource
		}))
	);

	const datasourceName = watch('datasourceName');
	const datasourceDescription = watch('datasourceDescription');

	const handleDatasourcePost = async (data?) => {
		await datasourcePost(data, connector, datasourceName, datasourceDescription, posthog, router);
	};

	useEffect(() => {
		if (connector) {
			getSpecification(connector.sourceDefinitionId, posthog);
		}
	}, [connector]);

	useEffect(() => {
		if (stagedDatasource) {
			setValue('stagedDatasource', stagedDatasource);
		}
	}, [stagedDatasource]);

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
							datasourcePost={handleDatasourcePost}
							error={error}
						/>
					</FormContext>
				</>
			)}
		</div>
	);
};

export default DataSourceCredentialsForm;
