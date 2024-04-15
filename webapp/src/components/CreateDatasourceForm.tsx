'use strict';

import * as API from '@api';
import getConnectors from 'airbyte/getconnectors';
import ButtonSpinner from 'components/ButtonSpinner';
import CreateModelModal from 'components/CreateModelModal';
import DropZone from 'components/DropZone';
import ErrorAlert from 'components/ErrorAlert';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { ModelEmbeddingLength, ModelList } from 'struct/model';
import { DatasourceScheduleType } from 'struct/schedule';
import SelectClassNames from 'styles/SelectClassNames';
const TailwindForm = dynamic(() => import('components/rjsf'), {
	ssr: false,
});
import validator from '@rjsf/validator-ajv8';
const DynamicForm = dynamic(() => import('components/DynamicForm'), {
	ssr: false,
});
import { getSubmitButtonOptions, RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { StreamsList } from 'components/DatasourceStream';

const stepList = [
	// { id: 'Step 1', name: 'Select datasource type', href: '#', steps: [0] },
	{ id: 'Step 1', name: 'Connect datasource', href: '#', steps: [1, 2] },
	{ id: 'Step 2', name: 'Choose which data to sync', href: '#', steps: [3] },
	{ id: 'Step 3', name: 'Pick an embedding model', href: '#', steps: [4] },
];
// @ts-ignore
const DatasourceScheduleForm = dynamic(() => import('components/DatasourceScheduleForm'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});

export default function CreateDatasourceForm({ models, compact, callback, fetchDatasourceFormData, hideTabs, initialStep = 0, fetchDatasources }
	: { models?: any[], compact?: boolean, callback?: Function, fetchDatasourceFormData?: Function, hideTabs?: boolean, initialStep?: number, fetchDatasources?: Function }) { //TODO: fix any types

	const [step, setStep] = useState(initialStep);
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [error, setError]: any = useState(null);
	const [files, setFiles] = useState(null);
	const [datasourceName, setDatasourceName] = useState('');
	const [datasourceDescription, setDatasourceDescription] = useState('');
	const [embeddingField, setEmbeddingField] = useState('');
	const [modalOpen, setModalOpen] = useState(false);
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const [timeUnit, setTimeUnit] = useState('minutes');
	const [units, setUnits] = useState('');
	const [cronExpression, setCronExpression] = useState('');
	const [modelId, setModelId] = useState('');
	const foundModel = models && models.find(m => m._id === modelId);
	const [cronTimezone, setCronTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
	const [scheduleType, setScheduleType] = useState(DatasourceScheduleType.MANUAL);
	const [datasourceId, setDatasourceId] = useState(null);
	const [discoveredSchema, setDiscoveredSchema] = useState(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [streamState, setStreamState] = useState({ streams: [], selectedFieldsMap: {} });
	const [formData, setFormData] = useState(null);
	const SubmitButton = (props: SubmitButtonProps) => {
		const { uiSchema } = props;
		const { norender } = getSubmitButtonOptions(uiSchema);
		if (norender) {
			return null;
		}
		return (
			<button
				disabled={submitting}
				type='submit'
				className='w-full rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				{submitting && <ButtonSpinner />}
				{submitting ? 'Testing connection...' : 'Submit'}
			</button>
		);
	};

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
		  supportLevel: connectors[key]?.supportLevel_oss,
		})) : [];

	const modelCallback = async (addedModelId) => {
		await fetchDatasourceFormData && fetchDatasourceFormData();
		setModalOpen(false);
		setModelId(addedModelId);
	};

	async function datasourcePost(e) {
		setSubmitting(true);
		setError(null);
		try {
			if (step === 2) {
				const body = {
					sourceConfig: e.formData,
					_csrf: csrf,
					connectorId: connector.value,
					connectorName: connector.label,
					resourceSlug,
					scheduleType,
					timeUnit,
					units,
					cronExpression,
					cronTimezone,
					datasourceName,
					datasourceDescription,
					embeddingField,
				};
				//step 2, getting schema and testing connection
				await API.testDatasource(body, (stagedDatasource) => {
					console.log('stagedDatasource', stagedDatasource);
					if (stagedDatasource) {
						setDatasourceId(stagedDatasource.datasourceId);
						setDiscoveredSchema(stagedDatasource.discoveredSchema);
						setStep(3);
					} else {
						setError('Datasource connection test failed.'); //TODO: any better way to get error?
					}
					// nothing to toast here	
				}, (res) => {
					console.log(res);
					setError(res);
				}, compact ? null : router);
				// callback && stagedDatasource && callback(stagedDatasource._id);
			} else {
				//step 4, saving datasource
				e.preventDefault();
				const body = {
					_csrf: csrf,
					datasourceId: datasourceId,
					resourceSlug,
					scheduleType,
					timeUnit,
					units,
					modelId,
					cronExpression,
					cronTimezone,
					streams: streamState.streams,
					selectedFieldsMap: streamState.selectedFieldsMap,
					datasourceName,
					embeddingField,
				};
				const addedDatasource: any = await API.addDatasource(body, () => {
					toast.success('Added datasource');
				}, (res) => {
					toast.error(res);
				}, compact ? null : router);
				callback && addedDatasource && callback(addedDatasource._id);
			}
		} finally {
			setSubmitting(false);
		}
	}

	function getStepSection(_step) {
		//TODO: make steps enum
		switch (_step) {
			case 0:
				return <div className='flex justify-evenly space-x-4 mt-20 w-2/3 mx-auto'>
					<div className='flex flex-col items-center space-y-2'>
						<button 
							className='rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
							onClick={() => setStep(1)}
						>
							File Upload
						</button>
						<div className='text-sm'>
							Upload a file from your computer.
						</div>
					</div>
					<div className='flex flex-col items-center space-y-2'>
						<button 
							className='rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600'
							onClick={() => setStep(2)}
						>
							Data Connection
						</button>
						<div className='text-sm'>
							Sync data from external systems e.g. Google Sheets, Confluence.
						</div>
					</div>
				</div>;			
			case 1:
				return <DropZone
					files={files}
					setFiles={setFiles}
					modelId={modelId}
					name={datasourceName}
					description={datasourceDescription}
					callback={() => {
					//jank form reset (for now)
						setStep(initialStep);
						setFiles(null);
						setDatasourceName('');
						fetchDatasources();
					}}
					modalOpen={modalOpen}
				>
					<div>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							{/* cba moving */}
							Datasource Name<span className='text-red-700'> *</span>
						</label>
						<div>
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
						<label htmlFor='description' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Description<span className='text-red-700'> *</span>
						</label>
						<div>
							<input
								required
								type='text'
								name='description'
								id='description'
								onChange={(e) => setDatasourceDescription(e.target.value)}
								value={datasourceDescription}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							/>
						</div>
						<label htmlFor='modelId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-3'>
							Embedding Model<span className='text-red-700'> *</span>
						</label>
						<div className='mt-2'>
							<Select
								isClearable
					            primaryColor={'indigo'}
					            classNames={SelectClassNames}
					            value={foundModel ? { label: foundModel.name, value: foundModel._id } : null}
					            onChange={(v: any) => {
									if (v?.value === null) {
										//Create new pressed
										return setModalOpen(true);
									}
									setModelId(v?.value);
				            	}}
					            options={models.filter(m => ModelEmbeddingLength[m.model]).map(c => ({ label: c.name, value: c._id })).concat([{ label: '+ Create new embedding model', value: null }])}
					            formatOptionLabel={data => {
									const m = models.find(m => m._id === data?.value);
					                return (<li
					                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
					                        data.isSelected
					                            ? 'bg-blue-100 text-blue-500'
					                            : 'dark:text-white'
					                    }`}
					                >
					                    {data.label} {m ? `(${m?.model})` : null}
					                </li>);
					            }}
					        />
						</div>
						
					</div>
				</DropZone>;
			case 2:
				return <span className='flex'>
					<div className='w-full m-auto'>
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
									<span className='flex justify-between'>
										<span>
											{data?.icon && <img
												src={data.icon}
												loading='lazy'
												className='inline-flex me-2 w-4 h-4'
											/>}
											{data.label}
										</span>
										<span className={`px-1 rounded-full bg-${data.supportLevel==='certified'?'green':'gray'}-100 text-${data.supportLevel==='certified'?'green':'gray'}-700`}>
											{data.supportLevel}
										</span>
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
									<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'>
										Datasource Name<span className='text-red-700'> *</span>
									</label>
									<div>
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
									<DatasourceScheduleForm
										scheduleType={scheduleType}
										setScheduleType={setScheduleType}
										timeUnit={timeUnit}
										setTimeUnit={setTimeUnit}
										units={units}
										setUnits={setUnits}
										cronExpression={cronExpression}
										setCronExpression={setCronExpression}
										cronTimezone={cronTimezone}
										setCronTimezone={setCronTimezone}
									/>
								</div>
								<TailwindForm
									schema={spec.schema.connectionSpecification}
									formData={formData}
									onChange={(e) => setFormData(e.formData)}
									templates={{ ButtonTemplates: { SubmitButton } }}
									validator={validator}
									onSubmit={datasourcePost}
									transformErrors={(errors) => {
										return errors.filter(e => e.name !== 'pattern'); //filter datetime pattern 
									}}
									noHtml5Validate
								>
									{error && <div className='mb-4'><ErrorAlert error={error} /></div>}
									<button
										disabled={submitting}
										type='submit'
										className='w-full rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
									>
										{submitting && <ButtonSpinner />}
										{submitting ? 'Testing connection...' : 'Submit'}
									</button>
								</TailwindForm>
							</>}
		
					</div>
				</span>;
			case 3:
				return discoveredSchema && <form onSubmit={(e: any) => {
					e.preventDefault();
					const streams = Array.from(e.target.elements)
						.filter(x => x['checked'] === true)
						.filter(x => !x['dataset']['parent'])
						.map(x => x['name']);
					const selectedFieldsMap = Array.from(e.target.elements)
						.filter(x => x['checked'] === true)
						.filter(x => x['dataset']['parent'])
						.reduce((acc, x) => {
							acc[x['dataset']['parent']] = (acc[x['dataset']['parent']]||[]).concat([x['name']]);
							return acc;
						}, {});
					setStreamState({ streams, selectedFieldsMap});
					setStep(4);
				}}>
					<StreamsList
						streams={discoveredSchema.catalog.streams}
					/>
					<div className='flex justify-end'>
						<button
							disabled={submitting}
							type='submit'
							className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
						>
							{submitting && <ButtonSpinner />}
							Continue
						</button>
					</div>
				</form>;
			case 4:
				return <>
					<form onSubmit={datasourcePost}>
						<div className='space-y-4'>
							<div>
								<label htmlFor='embeddingField' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Field To Embed<span className='text-red-700'> *</span>
								</label>
								<div>
									<select
										required
										name='embeddingField'
										id='embeddingField'
										onChange={(e) => setEmbeddingField(e.target.value)}
										value={embeddingField}
										className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									>
										{streamState?.streams?.map((stream, ei) => {
											const foundStreamSchema = discoveredSchema?.catalog?.streams?.find(st => st?.stream?.name === stream);
											const foundSchemaKeys = streamState?.selectedFieldsMap[stream]
												|| Object.keys(foundStreamSchema?.stream?.jsonSchema?.properties);
											return <optgroup label={stream} key={`embeddingField_optgroup_${ei}`}>
												{foundSchemaKeys
													.map((sk, ski) => (<option key={`embeddingField_option_${ski}`} value={sk}>{sk}</option>))}
											</optgroup>;
										})}
									</select>
								</div>
							</div>
							<div>
								<label htmlFor='modelId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Embedding Model
								</label>
								<div className='mt-2'>
									<Select
										isClearable
							            primaryColor={'indigo'}
							            classNames={SelectClassNames}
							            value={foundModel ? { label: foundModel.name, value: foundModel._id } : null}
							            onChange={(v: any) => {
											if (v?.value === null) {
												//Create new pressed
												return setModalOpen(true);
											}
											setModelId(v?.value);
						            	}}
							            options={models.filter(m => ModelEmbeddingLength[m.model]).map(c => ({ label: c.name, value: c._id })).concat([{ label: '+ Create new model', value: null }])}
							            formatOptionLabel={data => {
											const m = models.find(m => m._id === data?.value);
							                return (<li
							                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
							                        data.isSelected
							                            ? 'bg-blue-100 text-blue-500'
							                            : 'dark:text-white'
							                    }`}
							                >
							                    {data.label} {m ? `(${m?.model})` : null}
							                </li>);
							            }}
							        />
								</div>
							</div>
							<button
								disabled={submitting}
								type='submit'
								className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
							>
								{submitting && <ButtonSpinner />}
								Continue
							</button>
						</div>
					</form>
				</>;
			default:
				return null;
		}
	}

	return (<div>
		<SubscriptionModal open={subscriptionModalOpen !== false} setOpen={setSubscriptionModalOpen} title='Upgrade Required' text='You need to upgrade to access 260+ more data connections' buttonText='Upgrade' />
		<CreateModelModal open={modalOpen !== false} setOpen={setModalOpen} callback={modelCallback} />
		{!hideTabs && <nav aria-label='Progress' className='mb-10'>
			<ol role='list' className='space-y-4 md:flex md:space-x-8 md:space-y-0'>
				{stepList.map((stepData, si) => (
					<li key={stepData.name} className='md:flex-1 cursor-pointer'>
						{step > stepData.steps[stepData.steps.length-1] ? (
							<a
								href={stepData.href}
								className='group flex flex-col border-l-4 border-indigo-600 py-2 pl-4 hover:border-indigo-800 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4'
							>
								<span className='text-sm font-medium text-indigo-600 group-hover:text-indigo-800'>{stepData.id}</span>
								<span className='text-sm font-medium'>{stepData.name}</span>
							</a>
						) : stepData.steps.includes(step) ? (
							<a
								href={stepData.href}
								className='flex flex-col border-l-4 border-indigo-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4'
								aria-current='step'
							>
								<span className='text-sm font-medium text-indigo-600'>{stepData.id}</span>
								<span className='text-sm font-medium'>{stepData.name}</span>
							</a>
						) : (
							<a
								href={stepData.href}
								className='group flex flex-col border-l-4 border-gray-200 py-2 pl-4 hover:border-gray-300 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4'
							>
								<span className='text-sm font-medium text-gray-500 group-hover:text-gray-700'>{stepData.id}</span>
								<span className='text-sm font-medium'>{stepData.name}</span>
							</a>
						)}
					</li>
				))}
			</ol>
		</nav>}

		{getStepSection(step)}

	</div>);

}
