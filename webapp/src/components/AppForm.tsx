'use strict';

import * as API from '@api';
import {
	HandRaisedIcon,
} from '@heroicons/react/20/solid';
import CreateAgentModal from 'components/CreateAgentModal';
// import CreateToolModal from 'components/CreateToolModal';
import CreateTaskModal from 'components/CreateTaskModal';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { AppType } from 'struct/app';

export default function AppForm({ agentChoices = [], taskChoices = [], /*toolChoices = [], */ modelChoices=[], crew = {}, app = {}, editing, compact=false, callback, fetchFormData }
	: { agentChoices?: any[], taskChoices?: any[], /*toolChoices?: any[],*/ crew?: any, modelChoices:any, app?: any, editing?: boolean, compact?: boolean, callback?: Function, fetchFormData?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen]: any = useState(false);
	const [crewState, setCrew] = useState(crew);
	const [appState, setApp] = useState(app);
	const [managerModels, setManagerModels] = useState(modelChoices.filter(model => model._id == crew.managerModelId).map(m => ({ label: m.name, value: m._id })));
	const [appTypeState, setAppTypeState] = useState(app.appType || AppType.CHAT);
	const [error, setError] = useState();
	const { name, agents, tasks, tools } = crewState;
	const { description, tags } = appState; //TODO: make it take correct stuff from appstate

	const initialAgents = agents && agents.map(a => {
		const oa = agentChoices.find(ai => ai._id === a);
		return oa ? { label: oa.name, value: a, allowDelegation: oa.allowDelegation } : null;
	}).filter(n => n);
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
			description: e.target.description.value,
			agents: agentsState.map(a => a.value),
			appType: appTypeState,
			managerModelId: managerModels && managerModels.length > 0 ? managerModels[0].value : undefined,
			tasks: tasksState.map(x => x.value),
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
						<div className='sm:col-span-12'>
							<label htmlFor='description' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Description
							</label>
							<textarea
								name='description'
								id='description'
								defaultValue={description}
								className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								rows={5}
							/>
						</div>
						<div className='sm:col-span-12'>
							<label htmlFor='members' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Tasks
							</label>
							<div className='mt-2'>
								<Select
									isMultiple
									isSearchable
						            primaryColor={'indigo'}
						            classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
						            }}
						            value={tasksState}
						            onChange={(v: any) => {
										if (v && v.length > 0 && v[v.length-1]?.value == null) {
											return setModalOpen('task');
										}
										setTasksState(v||[]);
        						   	}}
						            options={taskChoices
						            	.map(a => ({ label: a.name, value: a._id }))
						            	.concat([{ label: '+ New task', value: null }])}
						            formatOptionLabel={(data: any) => {
						            	const optionTask = taskChoices.find(tc => tc._id === data.value);
						                return (<li
						                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
						                        data.isSelected
						                            ? 'bg-blue-100 text-blue-500'
						                            : 'dark:text-white'
						                    }`}
						                >
						                    {data.label}{optionTask ? ` (${optionTask.description})` : null}
						                </li>);
						            }}
						        />
							</div>
						</div>
						
						<div className='sm:col-span-12'>
							<label htmlFor='members' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Agents
							</label>
							<div className='mt-2'>
								<Select
									isMultiple
									isSearchable
						            primaryColor={'indigo'}
						            classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
						            }}
						            value={agentsState}
						            onChange={(v: any) => {
										if (v && v.length > 0 && v[v.length-1]?.value == null) {
											return setModalOpen('agent');
										}
										setAgentsState(v||[]);
        						   	}}
						            options={agentChoices
						            	.map(a => ({ label: a.name, value: a._id, allowDelegation: a.allowDelegation })) // map to options
						            	.concat([{ label: '+ Create new agent', value: null, allowDelegation: false }])} // append "add new"
						            formatOptionLabel={(data: any) => {
						            	const optionAgent = agentChoices.find(ac => ac._id === data.value);
						                return (<li
						                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
						                        data.isSelected
						                            ? 'bg-blue-100 text-blue-500'
						                            : 'dark:text-white'
						                    }`}
						                >
						                    {data.label}{optionAgent ? ` - ${optionAgent.role}` : null} 
								            {data.allowDelegation && <span className='tooltip z-100'>
									            <span className='h-5 w-5 inline-flex items-center rounded-full bg-green-100 mx-1 px-2 py-1 text-xs font-semibold text-green-700'>
													<HandRaisedIcon className='h-3 w-3 absolute -ms-1' />
       											</span>
							        			<span className='tooltiptext'>
													This agent allows automatic task delegation.
												</span>
											</span>}
						                </li>);
						            }}
						        />
							</div>
						</div>
						<div className='sm:col-span-12'>
							<label className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								App Type
							</label>
							<div className='mt-2'>
								<label className='inline-flex items-center mr-6 text-sm'>
									<input
										type='radio'
										name='process'
										value={AppType.CHAT}
										defaultChecked={appTypeState === AppType.CHAT}
										onChange={(e) => { e.target.checked && setAppTypeState(AppType.CHAT); }}
										className='form-radio'
									/>
									<span className='ml-2'>Chat</span>
								</label>
								<label className='inline-flex items-center text-sm'>
									<input
										type='radio'
										name='process'
										value={AppType.PROCESS}
										defaultChecked={appTypeState === AppType.PROCESS}
										onChange={(e) => { e.target.checked && setAppTypeState(AppType.PROCESS); e.target.checked && setManagerModels([]); }}
										className='form-radio'
									/>
									<span className='ml-2'>Process</span>
								</label>
							</div>
						</div>
						{appTypeState === AppType.CHAT && <div className='sm:col-span-12'>
							<label htmlFor='managermodel' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Chat Manager Model
							</label>
							<div className='mt-2'>
								<Select
									isMultiple
									isSearchable
						            primaryColor={'indigo'}
						            classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
						            }}
						            value={managerModels}
						            onChange={(v: any) => {
										setManagerModels(v);
        						   	}}
						            options={modelChoices.filter(model => model.modelType == undefined || model.modelType == 'llm')
						            	.map(m => ({ label: m.name, value: m._id }))} // map to options
						            	// .concat([{ label: '+ Create new agent', value: null, allowDelegation: false }])} // append "add new"
						            formatOptionLabel={(data: any) => {
						                return (<li
						                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
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
