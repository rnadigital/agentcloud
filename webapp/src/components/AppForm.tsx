'use strict';
import * as API from '@api';
import {
	HandRaisedIcon,
} from '@heroicons/react/20/solid';
import CreateAgentModal from 'components/CreateAgentModal';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { ProcessImpl } from 'struct/crew';

export default function AppForm({ agentChoices = [], taskChoices = [], crew = {}, app = {}, editing, compact=false, callback, fetchAgents }
	: { agentChoices?: any[], taskChoices?: any[], crew?: any, app?: any, editing?: boolean, compact?: boolean, callback?: Function, fetchAgents?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen] = useState(false);
	const [processState, setProcessState] = useState(crew.process || ProcessImpl.SEQUENTIAL);
	const [crewState, setCrew] = useState(crew);
	const [appState, setApp] = useState(app);
	const [error, setError] = useState();

	const initialAgents = crew.agents && crew.agents.map(a => {
		const oa = agentChoices.find(ai => ai._id === a);
		return { label: oa.name, value: a, allowDelegation: oa.allowDelegation };
	});
	const [agentsState, setAgentsState] = useState(initialAgents || []);
	const { _id, name, agents, description, tags, process } = crewState;
	// const { _id, name, agents, description, tags, process } = appState; //TODO: make it take correct stuff from appstate

	async function appPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			description: e.target.description.value,
			agents: agentsState.map(a => a.value),
			process: processState,
		};
		if (editing) {
			await API.editApp(appState._id, body, () => {
				toast.success('App Updated');
			}, setError, null);
		} else {
			const addedApp: any = await API.addApp(body, null, toast.error, compact ? null : router);
			callback && addedApp && callback(addedApp._id);
		}
	}

	async function createAgentCallback() {
		await fetchAgents && fetchAgents();
		setModalOpen(false);
	}

	return (<>
		<CreateAgentModal open={modalOpen} setOpen={setModalOpen} callback={createAgentCallback} />
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
											return setModalOpen(true);
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
								Process Implementation
							</label>
							<div className='mt-2'>
								<label className='inline-flex items-center mr-6 text-sm'>
									<input
										type='radio'
										name='process'
										value={ProcessImpl.SEQUENTIAL}
										checked={processState === ProcessImpl.SEQUENTIAL}
										onChange={() => setProcessState(ProcessImpl.SEQUENTIAL)}
										className='form-radio'
									/>
									<span className='ml-2'>Sequential</span>
								</label>
								<label className='inline-flex items-center text-sm'>
									<input
										type='radio'
										name='process'
										value={ProcessImpl.HEIRARCHICAL}
										checked={processState === ProcessImpl.HEIRARCHICAL}
										onChange={() => setProcessState(ProcessImpl.HEIRARCHICAL)}
										className='form-radio'
									/>
									<span className='ml-2'>Hierarchical</span>
								</label>
							</div>
						</div>
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
