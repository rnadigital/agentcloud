'use strict';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '@api';
import { toast } from 'react-toastify';
import SelectClassNames from 'styles/SelectClassNames';
import getConnectors from 'airbyte/getconnectors';
import Select from 'react-tailwindcss-select';
import ButtonSpinner from 'components/ButtonSpinner';
import DropZone from 'components/DropZone';
import dynamic from 'next/dynamic';
const TailwindForm = dynamic(() => import('components/rjsf'), {
	ssr: false,
});
import validator from '@rjsf/validator-ajv8';
const DynamicForm = dynamic(() => import('components/DynamicForm'), {
	ssr: false,
});

export default function DatasourceForm({ agent = {}, credentials = [], tools=[], groups=[], editing, compact=false, callback, fetchAgentFormData }
	: { agent?: any, credentials?: any[], tools?: any[], groups?: any[], editing?: boolean, compact?: boolean, callback?: Function, fetchAgentFormData?: Function }) { //TODO: fix any types

	const [step, setStep] = useState(0);
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [error, setError] = useState();
	const [files, setFiles] = useState(null);
	const [datasourceName, setDatasourceName] = useState('');
	const [loading, setLoading] = useState(false);

	const [spec, setSpec] = useState(null);
	async function getSpecification(sourceDefinitionId: string) {
		API.getSpecification({
			sourceDefinitionId,
			resourceSlug,
		}, setSpec, setError, null);
		setLoading(false);
	}

	const [connectors, setConnectors] = useState([]);
	const [connector, setConnector] = useState(null);
	useEffect(() => {
		getConnectors()
			.then(json => setConnectors(json))
			.catch(e => {
				toast.error('Failed to fetch source connector list');
				setConnectors([]);
			});
	}, []);
	const connectorOptions = connectors ? Object.keys(connectors)
		.filter(key => connectors[key]?.connector_type === 'source')
		.map(key => ({
		  value: connectors[key]?.definitionId,
		  label: connectors[key]?.name_oss || 'test',
		  icon: connectors[key]?.iconUrl_oss,
		})) : [];

	async function datasourcePost(e) {
		const body = {
			sourceConfig: e.formData,
			_csrf: csrf,
			connectorId: connector.value,
			connectorName: connector.label,
			resourceSlug,
			datasourceName,
		};

		console.log(JSON.stringify(body, null, 2));

		if (editing) {			
			// await API.editAgent(agentState._id, body, () => {
			// 	toast.success('Agent Updated');
			// }, setError, null);
		} else {
			// const addedDatasource: any = await API.addDatasource(body, () => {
			const addedDatasource: any = await API.testDatasource(body, () => {
				toast.success('Added datasource');
			}, (res) => {
				toast.error(res);
			}, compact ? null : router);
			callback && addedDatasource && callback(addedDatasource._id);
		}
	}

	function getStepSection(_step) {
		switch (_step) {
			case 0:
				return <div className='flex justify-center space-x-4'>
					<div 
						className='flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
						onClick={() => setStep(1)}
					>
						File Upload
					</div>
					
					<div 
						className='flex justify-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
						onClick={() => setStep(2)}
					>
						Data Connection
					</div>
				</div>;			
			case 1:
				return <DropZone files={files} setFiles={setFiles} />;
			case 2:
				return <span className='flex'>
					<div className='w-full sm:w-1/3 m-auto'>
						<div className='text-center'>
							Select a data source to connect to:
						</div>
						<Select
							isClearable
							isSearchable
							loading={connectorOptions.length === 0}
							primaryColor={'indigo'}
							classNames={SelectClassNames}
							value={connector}
							onChange={(v: any) => {
								setLoading(v != null);
								setConnector(v);
								if (v) {
									getSpecification(v.value);
								} else {
									setSpec(null);
								}
							}}
							options={connectorOptions}
							formatOptionLabel={(data: any) => {
								return (<li
									className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
										data.isSelected
											? 'bg-blue-100 text-blue-500'
											: 'dark:text-white'
									}`}
								>
									<span>
										{data.icon && <img
											src={data.icon}
											loading='lazy'
											className='inline-flex me-2 w-4 h-4'
										/>}
										{data.label}
									</span>
								</li>);
							}}
						/>
		
						{loading
							? <div className='flex justify-center my-4'>
								<ButtonSpinner size={24} />
							</div>
							: spec?.schema && <>
								<div className='sm:col-span-12 my-3'>
									<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
										Datasource Name<span className='text-red-700'> *</span>
									</label>
									<div className='mt-2'>
										<input
											required
											type='text'
											name='name'
											id='name'
											onChange={(e) => setDatasourceName(e.target.value)}
											value={datasourceName}
											className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
										/>
									</div>
								</div>
								<TailwindForm
									schema={spec.schema.connectionSpecification}
									validator={validator}
									onSubmit={datasourcePost}
									transformErrors={(errors) => {
										return errors.filter(e => e.name !== 'pattern'); //filter datetime pattern 
									}}
									noHtml5Validate
								/>
							</>}
		
					</div>
				</span>;
			default:
				return null;
		}
	}

	return (<div className='m-4'>

		{step !== 0 && <button 
			className='flex justify-center rounded-md bg-gray-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
		    onClick={() => setStep(0)}
		>
		    Back
		</button>}

		{getStepSection(step)}

	</div>);

}
