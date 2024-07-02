'use strict';

import * as API from '@api';
import {
	HandRaisedIcon,
	PlayIcon
} from '@heroicons/react/20/solid';
import AgentsSelect from 'components/agents/AgentsSelect';
import AvatarUploader from 'components/AvatarUploader';
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import DatasourcesSelect from 'components/datasources/DatasourcesSelect';
import formatDatasourceOptionLabel from 'components/FormatDatasourceOptionLabel';
import InfoAlert from 'components/InfoAlert';
import ModelTypeRequirementsComponent from 'components/models/ModelTypeRequirements';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import ParameterForm from 'components/ParameterForm';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useReducer,useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { ModelType, ModelTypeRequirements } from 'struct/model';
import { ModelEmbeddingLength,ModelList } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content p-2'>Loading...</p>,
	ssr: false,
});
import { ProcessImpl } from 'struct/crew';

export default function SimpleAppForm({ agentChoices=[], datasourceChoices=[], callback, fetchFormData }
	: { agentChoices?: any, datasourceChoices?: any[], callback?: Function, fetchFormData?: Function }) { //TODO: fix any types

	const { step, setStep }: any = useStepContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen]: any = useState(false);
	const [description, setDescription] = useState('');
	const [modelType, setModelType] = useState(ModelType.OPENAI);
	const [conversationStarters, setConversationStarters] = useState([{name:''}]);
	const [systemMessage, setSystemMessage] = useState('');
	const [error, setError] = useState();
	const [datasourceState, setDatasourceState] = useState(null);
	const [run, setRun] = useState(false);
	const [icon, setIcon] = useState(null);
	const [config, setConfig] = useReducer(configReducer, {
		model: 'gpt-4o',
	});
	function configReducer(state, action) {
		return {
			...state,
			[action.name]: action.value
		};
	}

	const initialAgents = agentChoices && agentChoices.map(a => {
		const oa = agentChoices.find(ai => ai._id === a);
		return oa ? { label: oa.name, value: a, allowDelegation: oa.allowDelegation } : null;
	}).filter(n => n);
	const [agentsState, setAgentsState] = useState(initialAgents || []);

	async function appPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			modelType: modelType,
			config: config,
			datasourceId: datasourceState ? datasourceState?.value : null,
			conversationStarters: conversationStarters.map(x => x?.name.trim()),
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

	const iconCallback = async (addedIcon) => {
		await fetchFormData && fetchFormData();
		setModalOpen(false);
		setIcon(addedIcon);
	};

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
				<InfoAlert textColor='black' className='rounded bg-orange-200 p-4' message='Under Construction...' />

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Avatar
						</label>
						<div className='mt-2'>
							<AvatarUploader existingAvatar={icon} callback={iconCallback} />
						</div>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-x-8 gap-y-10 pb-6 border-b border-gray-900/10 pb-12'>
					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
						<div className='sm:col-span-12'>
							<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									App Name
							</label>
							<input
								required
								type='text'
								name='name'
								id='name'
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
						</div>

						<div className='sm:col-span-12'>
							<ParameterForm 
								readonly={false} 
								parameters={conversationStarters}
								setParameters={setConversationStarters} 
								title='Conversation Starters' 
								disableTypes={true} 
								disableDescription={true}
								hideRequired={true} 
								namePattern='[A-Z][A-Z0-9_]*'
								namePlaceholder=''
								descriptionPlaceholder='Value'
								addButtonText={'+'}
							/>
						</div>

						<hr className='col-span-12' />

						<AgentsSelect
							agentChoices={agentChoices}
							initialAgents={initialAgents}
							onChange={agentsState => setAgentsState(agentsState)}
							setModalOpen={setModalOpen}
						/>

						<div className='sm:col-span-12'>
							<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Agent Name
							</label>
							<input
								required
								type='text'
								name='name'
								id='name'
								className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							/>
						</div>

						<div className='sm:col-span-12 flex flex-row gap-4'>
							<div className='w-full'>
								<label htmlFor='systemMessage' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									System Message
								</label>
								<textarea
									name='systemMessage'
									id='systemMessage'
									value={systemMessage}
									onChange={e => {
										setSystemMessage(e.target.value);
									}}
									className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									rows={3}
								/>
							</div>
						</div>

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
									<option value={ModelType.OPENAI}>OpenAI</option>
									<option value={ModelType.OLLAMA}>Ollama</option>
									{/*<option value={ModelType.FASTEMBED}>FastEmbed</option>*/}
									<option value={ModelType.COHERE}>Cohere</option>
									<option value={ModelType.ANTHROPIC}>Anthropic</option>
									<option value={ModelType.GROQ}>Groq</option>
								</select>
							</div>
						</div>

						<div className='sm:col-span-12 space-y-6'>					
							<ModelTypeRequirementsComponent type={modelType} config={config} setConfig={setConfig} />
						</div>

						<div className='sm:col-span-12'>
							<DatasourcesSelect
	                            datasourceState={datasourceState}
	                            setDatasourceState={setDatasourceState}
	                            datasources={datasourceChoices}
	                            addNewCallback={setModalOpen}
	                        />
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
