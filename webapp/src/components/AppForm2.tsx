'use strict';

import * as API from '@api';
import {
	HandRaisedIcon,
} from '@heroicons/react/20/solid';
import AvatarUploader from 'components/AvatarUploader';
import CreateAgentModal from 'components/CreateAgentModal';
// import CreateToolModal from 'components/CreateToolModal';
import CreateTaskModal from 'components/CreateTaskModal';
import { useAccountContext } from 'context/account';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { AppType } from 'struct/app';
import { CredentialType, CredentialTypeRequirements } from 'struct/credential';
import { ModelList, ModelEmbeddingLength } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';


// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content p-2'>Loading...</p>,
	ssr: false,
});
import { ProcessImpl } from 'struct/crew';

export default function AppForm({ agentChoices = [], taskChoices = [], /*toolChoices = [], */ modelChoices=[], crew = {}, app = {}, editing, compact=false, callback, fetchFormData }
	: { agentChoices?: any[], taskChoices?: any[], /*toolChoices?: any[],*/ crew?: any, modelChoices:any, app?: any, editing?: boolean, compact?: boolean, callback?: Function, fetchFormData?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen]: any = useState(false);
	const [crewState, setCrew] = useState(crew);
	const [appState, setApp] = useState(app);
	const initialModel = modelChoices.find(model => model._id == crew.managerModelId);
	const [managerModel, setManagerModel] = useState(initialModel ? { label: initialModel.name, value: initialModel._id }: null);
	const [appTypeState, setAppTypeState] = useState(app.appType || AppType.CHAT);
	const [appMemory, setAppMemory] = useState(app.memory === true);
	const [appCache, setAppCache] = useState(app.cache === true);
	const [description, setDescription] = useState(app.description || '');
	const [modelType, setModelType] = useState(CredentialType.OPENAI);
	const [error, setError] = useState();
	const { name, agents, tasks, tools } = crewState;
	const { tags } = appState; //TODO: make it take correct stuff from appstate

	const initialAgents = agents && agents.map(a => {
		const oa = agentChoices.find(ai => ai._id === a);
		return oa ? { label: oa.name, value: a, allowDelegation: oa.allowDelegation } : null;
	}).filter(n => n);
	const [icon, setIcon] = useState(app?.icon);
	const [agentsState, setAgentsState] = useState(initialAgents || []);
	
	const initialTasks = tasks && tasks.map(t => {
		const ot = taskChoices.find(at => at._id === t);
		return ot ? { label: ot.name, value: t } : null;
	}).filter(n => n);
	const [tasksState, setTasksState] = useState(initialTasks || []);

	async function appPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			description,
			// process: e.target.process.value, 
			process: ProcessImpl.SEQUENTIAL,
			agents: agentsState.map(a => a.value),
			appType: appTypeState,
			memory: appMemory,
			cache: appCache,
			managerModelId: managerModel?.value,
			tasks: tasksState.map(x => x.value),
			iconId: icon?._id || icon?.id,
		};
		if (editing === true) {
			await API.editApp(appState._id, body, () => {
				toast.success('App Updated');
			}, setError, null);
		} else {
			const addedApp: any = await API.addApp(body, null, toast.error, compact ? null : router);
			callback && addedApp && callback(addedApp._id);
		}
	}

	async function createAgentCallback() {
		await fetchFormData && fetchFormData();
		setModalOpen(false);
	}

	// async function createToolCallback() { // TODO:
	// 	await fetchFormData && fetchFormData();
	// 	setModalOpen(false);
	// }

	async function createTaskCallback() { // TODO:
		await fetchFormData && fetchFormData();
		setModalOpen(false);
	}

	const iconCallback = async (addedIcon) => {
		await fetchFormData && fetchFormData();
		setModalOpen(false);
		setIcon(addedIcon);
	};

	let modal;
	switch (modalOpen) {
		case 'agent':
			modal = <CreateAgentModal open={modalOpen !== false} setOpen={setModalOpen} callback={createAgentCallback} />;
			break;
		case 'task':
			modal = <CreateTaskModal open={modalOpen !== false} setOpen={setModalOpen} callback={createTaskCallback} />;
			break;
		// case 'tool':
		// 	modal = <CreateToolModal open={modalOpen !== false} setOpen={setModalOpen} callback={createToolCallback} />;
		// 	break;
		default:
			modal = null;
			break;
	}

	return (<>
		{modal}
		<form onSubmit={appPost}>
			<input
				type='hidden'
				name='_csrf'
				value={csrf}
			/>

			<div className='space-y-4'>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								App Icon
						</label>
						<div className='mt-2'>
							<AvatarUploader existingAvatar={icon} callback={iconCallback} />
						</div>
					</div>
				</div>			

				<div className={`grid grid-cols-1 gap-x-8 gap-y-10 pb-6 border-b border-gray-900/10 pb-${compact ? '6' : '12'}`}>
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
									}}
								>
									<option disabled value=''>Select a type...</option>
									<option value={CredentialType.OPENAI}>OpenAI</option>
									<option value={CredentialType.OLLAMA}>Ollama</option>
									<option value={CredentialType.FASTEMBED}>FastEmbed</option>
									<option value={CredentialType.COHERE}>Cohere</option>
									<option value={CredentialType.ANTHROPIC}>Anthropic</option>
								</select>
							</div>
						</div>	

						{Object.entries(CredentialTypeRequirements[modelType]).filter(e => e[1]).map(([key, _], ei) => {
							return (<div key={`modelName_${ei}`}>
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
						{ModelList[modelType]?.length > 0 && <div className='sm:col-span-12'>
							<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Model
							</label>
							<div className='mt-2'>
								<Select
									isClearable
						            primaryColor={'indigo'}
						            classNames={SelectClassNames}
						            value={false ? { label: model, value: model } : null}
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

					</div>
				</div>			

			</div>

			<div className='mt-6 flex items-center justify-between gap-x-6'>
				{!compact && <button
					className='text-sm font-semibold leading-6 text-gray-900'
					onClick={(e) => {
						e.preventDefault();
						if (window.history.length > 1) {
							router.back();
						} else {
							router.push(`/${resourceSlug}/apps`);
						}
					}}
				>
					Back
				</button>}
				<button
					type='submit'
					className={`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}
				>
						Save
				</button>
			</div>
		</form>
	</>);

}
