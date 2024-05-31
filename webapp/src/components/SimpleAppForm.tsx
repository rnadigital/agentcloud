'use strict';

import * as API from '@api';
import {
	HandRaisedIcon,
	PlayIcon
} from '@heroicons/react/20/solid';
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import formatDatasourceOptionLabel from 'components/FormatDatasourceOptionLabel';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useReducer,useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { CredentialType, CredentialTypeRequirements } from 'struct/credential';
import { ModelEmbeddingLength,ModelList } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content p-2'>Loading...</p>,
	ssr: false,
});
import { ProcessImpl } from 'struct/crew';

export default function SimpleAppForm({ datasourceChoices=[], callback, fetchFormData }
	: { datasourceChoices?: any[], callback?: Function, fetchFormData?: Function }) { //TODO: fix any types

	const { step, setStep }: any = useStepContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen]: any = useState(false);
	const [description, setDescription] = useState('');
	const [modelType, setModelType] = useState(CredentialType.OPENAI);
	const [error, setError] = useState();
	const [datasourceState, setDatasourceState] = useState(null);
	const [run, setRun] = useState(false);
 
	const [config, setConfig] = useReducer(configReducer, {
		model: 'gpt-4o',
	});
	function configReducer(state, action) {
		return {
			...state,
			[action.name]: action.value
		};
	}

	async function appPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			modelType: modelType,
			config: config,
			datasourceId: datasourceState ? datasourceState?.value : null,
			toolIds: [], //TODO
			run,
		};
		API.addAppSimple(body, (res) => {
			if (run === true) {
				API.addSession({
					_csrf: e.target._csrf.value,
					resourceSlug,
					id: res._id,
				}, null, setError, router);
			}
		}, toast.error, router);
	}

	async function createDatasourceCallback(createdDatasource) {
		console.log('createDatasourceCallback', createdDatasource);
		await fetchFormData && fetchFormData();
		setDatasourceState({ label: createdDatasource.name, value: createdDatasource.datasourceId });
		setModalOpen(false);
	}

	let modal;
	switch (modalOpen) {
		case 'datasource':
			modal = <CreateDatasourceModal
				open={modalOpen !== false}
				setOpen={setModalOpen}
				callback={createDatasourceCallback}
			/>;
			break;
		default:
			modal = null;
			break;
	}

	return (<>
		{modal}
		<h2 className='text-xl font-bold mb-6'>
			Chat App
		</h2>
		<form onSubmit={appPost}>
			<input
				type='hidden'
				name='_csrf'
				value={csrf}
			/>

			<div className='space-y-4'>

				<div className='grid grid-cols-1 gap-x-8 gap-y-10 pb-6 border-b border-gray-900/10 pb-12'>
					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
						{/*<div className='sm:col-span-12'>
							<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									App Name
							</label>
							<input
								required
								type='text'
								name='name'
								id='name'
								defaultValue={name}
								className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							/>
						</div>
						<div className='sm:col-span-12 flex flex-row gap-4'>
							<div className='w-full'>
								<label htmlFor='description' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									App Description
								</label>
								<textarea
									name='description'
									id='description'
									value={description}
									onChange={e => {
										setDescription(e.target.value);
									}}
									className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									rows={3}
								/>
							</div>
						</div>*/}

						<div className='sm:col-span-12'>
							<label htmlFor='type' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Model Type
							</label>
							<div className='mt-2'>
								<select
									required
									id='type'
									name='type'
									className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									value={modelType}
									onChange={(e: any) => {
										setModelType(e.target.value);
										setConfig({
											name: 'model',
											value: null,
										});
									}}
								>
									<option disabled value=''>Select a type...</option>
									<option value={CredentialType.OPENAI}>OpenAI</option>
									<option value={CredentialType.OLLAMA}>Ollama</option>
									{/*<option value={CredentialType.FASTEMBED}>FastEmbed</option>*/}
									<option value={CredentialType.COHERE}>Cohere</option>
									<option value={CredentialType.ANTHROPIC}>Anthropic</option>
									<option value={CredentialType.GROQ}>Groq</option>
								</select>
							</div>
						</div>	

						{CredentialTypeRequirements[modelType] && Object.keys(CredentialTypeRequirements[modelType]).length > 0 && <div className='sm:col-span-12'>
							{Object.entries(CredentialTypeRequirements[modelType]).filter(e => e[1]).map(([key, _], ei) => {
								return (<div key={`modelName_${modelType}_${ei}`}>
									<label htmlFor='modelName' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
										{key}
									</label>
									<div className='mt-2'>
										<input
											type='text'
											name={key}
											id={key}
											className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
											onChange={e => setConfig(e.target)}
											required
											defaultValue={config[key]}
										/>
									</div>
								</div>);
							})}
						</div>}
						{ModelList[modelType]?.length > 0 && <div className='sm:col-span-12'>
							<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Model
							</label>
							<div className='mt-2'>
								<Select
									isClearable
						            primaryColor={'indigo'}
						            classNames={SelectClassNames}
						            value={config?.model ? { label: config?.model, value: config?.model } : null}
						            onChange={(v: any) => {
				            			setConfig({
											name: 'model',
											value: v?.value,
				            			});
					            	}}
						            options={ModelList && ModelList[modelType] && ModelList[modelType].filter(m => !ModelEmbeddingLength[m]).map(m => ({ label: m, value: m }))}
						            formatOptionLabel={data => {
						                return (<li
						                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
						                        data.isSelected
						                            ? 'bg-blue-100 text-blue-500'
						                            : 'dark:text-white'
						                    }`}
						                >
						                    {data.label}
						                </li>);
						            }}
						        />
							</div>
						</div>}

						<div className='sm:col-span-12'>
							<label htmlFor='credentialId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Datasources
							</label>
							
							<div className='mt-2'>
								<Select
									isSearchable
						            primaryColor={'indigo'}
						            classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
						            }}
						            value={datasourceState}
						            onChange={(v: any) => {
							            if (v?.value === null) {
											//Create new pressed
											return setModalOpen('datasource');
										}
						            	setDatasourceState(v);
					            	}}
						            options={datasourceChoices
						            	// .filter(t => t?.status === DatasourceStatus.READY)
						            	.map(t => ({ label: `${t.name} (${t.originalName})`, value: t._id, ...t }))
						            	.concat([{ label: '+ New Datasource', value: null }])}
						            formatOptionLabel={formatDatasourceOptionLabel}
						        />
							</div>
						</div>			

					</div>
				</div>			

			</div>

			<div className='mt-6 flex items-center justify-between gap-x-6'>
				<button
					className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center'
					onClick={(e) => {
						e.preventDefault();
						step > 0 ? setStep(0) : router.push(`/${resourceSlug}/apps`);
					}}
				>
					<svg className='h-4 w-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7'></path>
					</svg>
					<span>Back</span>
				</button>
				<div className='flex gap-x-4'>
					<button
						type='submit'
						onClick={() => setRun(false)}
						className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Save
					</button>
					<button
						type='submit'
						onClick={() => setRun(true)}
						className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center'
					>
						<PlayIcon className='h-4 w-4 mr-2' />
						Save and Run
					</button>
				</div>
			</div>
		</form>
	</>);

}
