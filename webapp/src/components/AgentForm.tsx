'use strict';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '../api';
import { toast } from 'react-toastify';
import Select from 'react-tailwindcss-select';
import { ModelList } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';
import CreateCredentialModal from '../components/CreateCredentialModal';
import { AgentType } from 'struct/agent';

export default function AgentForm({ agent = {}, credentials = [], tools=[], groups=[], editing, compact=false, callback, fetchAgentFormData }
	: { agent?: any, credentials?: any[], tools?: any[], groups?: any[], editing?: boolean, compact?: boolean, callback?: Function, fetchAgentFormData?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen] = useState(false);
	const [agentState, setAgent] = useState(agent);
	const [error, setError] = useState();
	const { verifysuccess } = router.query;

	const { _id, name, type, systemMessage, codeExecutionConfig, credentialId, model, toolIds, datasourceIds } = agentState;
	const foundCredential = credentials && credentials.find(c => c._id === credentialId);

	const initialTools = agent.toolIds && agent.toolIds.map(tid => {
		const foundTool = tools.find(t => t._id === tid);
		if (!foundTool) { return null; }
		return { label: foundTool.name, value: foundTool._id };
	}).filter(t => t);
	const [toolState, setToolState] = useState(initialTools || []);

	//TODO:
	// const initialDatasources = agent.datasourceIds && agent.datasourceIds.map(did => {
	// 	const foundSource = datasources.find(d => d._id === did);
	// 	if (!foundSource) { return null; }
	// 	return { label: foundSource.name, value: foundSource._id };
	// }).filter(t => t);
	// const [datasourcesState, setDatasourcesState] = useState(initialDatasources || []);

	useEffect(() => {
		if (credentials && credentials.length > 0 && !credentialId) {
			setAgent({
				...agentState,
				credentialId: credentials[0]._id,
				model: ModelList[credentials[0].platform][0],
			});
		}
	}, []);

	async function agentPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			type: e.target.type.value,
			model: model,
			credentialId: credentialId,
			systemMessage: e.target.systemMessage.value,
			toolIds: toolState ? toolState.map(t => t.value) : [],
			datasourceIds: [], //TODO
		};
		if (editing) {			
			await API.editAgent(agentState._id, body, () => {
				toast.success('Agent Updated');
			}, setError, null);
		} else {
			const addedAgent: any = await API.addAgent(body, null, setError, compact ? null : router);
			callback && addedAgent && callback(addedAgent._id);
		}
	}

	const credentialCallback = async (addedCredentialId) => {
		await fetchAgentFormData && fetchAgentFormData();
		setModalOpen(false);
		console.log(addedCredentialId);
		setAgent(oldAgent => {
			return {
				...oldAgent,
				credentialId: addedCredentialId,
				model: '',
			};
		});
	};

	return (<>
		<CreateCredentialModal open={modalOpen} setOpen={setModalOpen} callback={credentialCallback} />
		<form onSubmit={agentPost}>
			<input
				type='hidden'
				name='_csrf'
				value={csrf}
			/>
			<div className={`space-y-${compact ? '6' : '12'}`}>

				<div className={`grid grid-cols-1 gap-x-8 gap-y-10 pb-6 border-b border-gray-900/10 pb-${compact ? '6' : '12'} md:grid-cols-${compact ? '1' : '3'}`}>
					{!compact && <div>
						<h2 className='text-base font-semibold leading-7 text-gray-900 dark:text-white'>Agent Details</h2>
						<p className='mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400'>Choose the name, credentials and model to use for this agent.</p>
					</div>}

					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
						<div className='sm:col-span-12'>
							<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Agent Name
							</label>
							<div className='mt-2'>
								<input
									required
									type='text'
									name='name'
									id='name'
									defaultValue={name}
									className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								/>
							</div>
						</div>

						<div className='sm:col-span-12'>
							<label htmlFor='credentialId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Credentials
							</label>
							<div className='mt-2'>
								<Select
									isClearable
						            primaryColor={'indigo'}
						            classNames={SelectClassNames}
						            value={foundCredential ? { label: foundCredential.name, value: foundCredential._id } : null}
						            onChange={(v: any) => {
										if (v?.value === null) {
											//Create new pressed
											return setModalOpen(true);
										}
						            	setAgent(oldAgent => {
   											return {
   												...oldAgent,
   												credentialId: v?.value,
   												model: '',
   											};
   										});
					            	}}
						            options={credentials.map(c => ({ label: c.name, value: c._id })).concat([{ label: '+ Create new credential', value: null }])}
						            formatOptionLabel={data => {
   										const optionCred = credentials.find(oc => oc._id === data.value);
						                return (<li
						                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
						                        data.isSelected
						                            ? 'bg-blue-100 text-blue-500'
						                            : 'dark:text-white'
						                    }`}
						                >
						                    {data.label} {optionCred ? `(${optionCred?.platform})` : null}
						                </li>);
						            }}
						        />
							</div>
						</div>
						{credentialId && <div className='sm:col-span-12'>
							<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Model
							</label>
							<div className='mt-2'>
								<Select
									isClearable
						            primaryColor={'indigo'}
						            classNames={SelectClassNames}
						            value={model ? { label: model, value: model } : null}
						            onChange={(v: any) => {
						            	setAgent(oldAgent => {
   											return {
   												...oldAgent,
   												model: v?.value,
   											};
   										});
					            	}}
						            options={ModelList && foundCredential && ModelList[foundCredential.platform] && ModelList[foundCredential.platform].map(m => ({ label: m, value: m }))}
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
							<fieldset>
								<legend className='mb-2 text-sm font-semibold leading-6 text-gray-900'>Type</legend>
								<div className='space-y-6'>
									<div className='flex items-center gap-x-3'>
										<div className='flex h-6 items-center'>
											<input
												required
												id='executor-agent'
												name='type'
												type='radio'
												value={AgentType.EXECUTOR_AGENT}
												className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'
												defaultChecked={codeExecutionConfig != null}
											/>
										</div>
										<div className='text-sm leading-6'>
											<label htmlFor='executor-agent' className='block text-sm font-semibold leading-6 text-gray-900 dark:text-slate-400'>
							                    Executor Agent
												<p className='font-medium text-gray-500'>An agent that executes code.</p>
											</label>
										</div>
									</div>
									<div className='flex items-center gap-x-3'>
										<div className='flex h-6 items-center'>
											<input
												required
												id='user-proxy-agent'
												name='type'
												type='radio'
												value={AgentType.USER_PROXY_AGENT}
												className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'
												defaultChecked={type === AgentType.USER_PROXY_AGENT && !codeExecutionConfig}
											/>
										</div>
										<div className='text-sm leading-6'>
											<label htmlFor='user-proxy-agent' className='block text-sm font-semibold leading-6 text-gray-900 dark:text-slate-400'>
		                    					User Proxy Agent
												<p className='font-medium text-gray-500'>A proxy agent for the user, that can execute code and provide feedback to the other agents.</p>
											</label>
										</div>
									</div>
									<div className='flex items-center gap-x-3'>
										<div className='flex h-6 items-center'>
											<input
												id='assistant-agent'
												name='type'
												type='radio'
												value={AgentType.ASSISTANT_AGENT}
												className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'
												defaultChecked={type === AgentType.ASSISTANT_AGENT}
											/>
										</div>
										<div className='text-sm leading-6'>
											<label htmlFor='assistant-agent' className='block text-sm font-semibold leading-6 text-gray-900 dark:text-slate-400'>
							                    Assistant Agent
												<p className='font-medium text-gray-500'>Assistant agent, designed to solve a task with LLM.</p>
											</label>
										</div>
									</div>
								</div>
							</fieldset>
						</div>

						<div className='sm:col-span-12'>
							<label htmlFor='credentialId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Tools
							</label>
							<div className='mt-2'>
								<Select
									isSearchable
									isMultiple
						            primaryColor={'indigo'}
						            classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
						            }}
						            value={toolState}
						            onChange={(v: any) => {
						            	console.log(v);
						            	setToolState(v);
					            	}}
						            options={tools.map(t => ({ label: t.name, value: t._id }))}
						            formatOptionLabel={data => {
										const optionTool = tools.find(ac => ac._id === data.value);
						                return (<li
						                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
						                        data.isSelected
						                            ? 'bg-blue-100 text-blue-500'
						                            : 'dark:text-white'
						                    }`}
						                >
						                    {data.label}{` - ${optionTool.data.description}`}
						                </li>);
						            }}
						        />
							</div>
						</div>

						<div className='sm:col-span-12'>
							<label htmlFor='credentialId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Datasources
							</label>
							<div className='mt-2'>
								<Select
									isSearchable
									isMultiple
						            primaryColor={'indigo'}
						            classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
						            }}
						            value={/*TODO: datasourcesState*/[]}
						            onChange={(v: any) => {
						            	console.log(v);
						            	//setDatasourcesState(v);
					            	}}
						            options={/*TODO:*/[].map(t => ({ label: t.name, value: t._id }))}
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
						</div>
						
					</div>

				</div>
				
				<div className={`grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-6 md:grid-cols-${compact ? '1' : '3'}`}>
					{!compact && <div>
						<h2 className='text-base font-semibold leading-7 text-gray-900 dark:text-white'>Instructions</h2>
						<p className='mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400'>
							Provide instructions for your agent. Here are some questions to answer for some example custom instructions:
						</p>
						<ol className='pl-5 list-disc mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400'>
							<li>What skills does the agent have?</li>
							<li>What should the agent do?</li>
							<li>What inputs and/or outputs should this agent process?</li>
							<li>Who should this agent interact with?</li>
							<li>How formal or casual should your agent be?</li>
							<li>How long or short should responses generally be?</li>
						</ol>
					</div>}

					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>

						<div className='col-span-full'>
							<label htmlFor='definition' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Instructions
							</label>
							<div className='mt-2'>
								<textarea
									required
									id='definition'
									name='systemMessage'
									rows={8}
									className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									defaultValue={systemMessage}
								/>
							</div>
							{/*<p className='mt-3 text-sm leading-6 text-gray-600'></p>*/}
						</div>
					</div>
				</div>

			</div>

			<div className='mt-6 flex items-center justify-between gap-x-6'>
				{!compact && <Link
					className='text-sm font-semibold leading-6 text-gray-900'
					href={`/${resourceSlug}/agents`}
				>
					Back
				</Link>}
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
