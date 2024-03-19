'use strict';

import * as API from '@api';
import CreateModelModal from 'components/CreateModelModal';
import CreateToolModal from 'components/CreateToolModal';
import ToolSelectIcons from 'components/ToolSelectIcons';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { ModelEmbeddingLength, ModelList } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

export default function AgentForm({ agent = {}, models = [], tools=[], groups=[], editing, compact=false, callback, fetchAgentFormData }
	: { agent?: any, models?: any[], tools?: any[], groups?: any[], editing?: boolean, compact?: boolean, callback?: Function, fetchAgentFormData?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen]: any = useState(false);
	const [callbackKey, setCallbackKey] = useState(null);
	const [allowDelegation, setAllowDelegation] = useState(agent.allowDelegation || false);
	const [verbose, setVerbose] = useState(agent.verbose || false);
	const [agentState, setAgent] = useState(agent);
	const [error, setError] = useState();
	const { verifysuccess } = router.query;

	const { _id, name, modelId, functionModelId, toolIds, role, goal, backstory } = agentState;
	const foundModel = models && models.find(m => m._id === modelId);
	const foundFunctionModel = models && models.find(m => m._id === functionModelId);

	const initialTools = agent.toolIds && agent.toolIds
		.map(tid => {
			const foundTool = tools.find(t => t._id === tid);
			if (!foundTool) { return null; }
			return { label: foundTool.name, value: foundTool._id };
		})
		.filter(t => t);
	const [toolState, setToolState] = useState(initialTools || []);

	useEffect(() => {
		if (models && models.length > 0 && !modelId) {
			setAgent({
				...agentState,
				modelId: models.find(m => !ModelEmbeddingLength[m.model])?._id,
				functionModelId: models.find(m => !ModelEmbeddingLength[m.model])?._id,
			});
		}
	}, []);

	async function agentPost(e) {
		e.preventDefault();
		const body: any = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			modelId,
			functionModelId,
			allowDelegation: allowDelegation === true,
			verbose: verbose === true,
			role: e.target.role.value,
			goal: e.target.goal.value,
			backstory: e.target.backstory.value,
			toolIds: toolState ? toolState.map(t => t.value) : [],
		};
		if (editing) {			
			await API.editAgent(agentState._id, body, () => {
				toast.success('Agent Updated');
			}, (res) => {
				toast.error(res);
			}, null);
		} else {
			const addedAgent: any = await API.addAgent(body, () => {
				toast.success('Added new agent');
			}, (res) => {
				toast.error(res);
			}, compact ? null : router);
			callback && addedAgent && callback(addedAgent._id);
		}
	}

	const modelCallback = async (addedModelId) => {
		await fetchAgentFormData && fetchAgentFormData();
		setModalOpen(false);
		setAgent(oldAgent => {
			return {
				...oldAgent,
				[callbackKey as any]: addedModelId,
			};
		});
		setCallbackKey(null);
	};

	const toolCallback = async (addedToolId, body) => {
		await fetchAgentFormData && fetchAgentFormData();
		setModalOpen(false);
		setToolState([{ label: `${body.name} (${body.type}) - ${body.description}`, value: addedToolId }]);
	};

	const handleToolSelect = (tool) => {
		if (toolState.some(t => t.value === tool._id)) {
			setToolState(oldTs => oldTs.filter(t => t.value !== tool._id));
		} else {
			setToolState(oldTs => oldTs.concat([tool]));
		}
	};

	return (<>
		{modalOpen === 'model'
			? <CreateModelModal open={modalOpen !== false} setOpen={setModalOpen} callback={modelCallback} />
			: <CreateToolModal open={modalOpen !== false} setOpen={setModalOpen} callback={toolCallback} />}
		<form onSubmit={agentPost}>
			<input
				type='hidden'
				name='_csrf'
				value={csrf}
			/>
			<div className='space-y-4'>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Name
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
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='col-span-full'>
						<label htmlFor='role' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Role
						</label>
						<div className='mt-2'>
							<textarea
								required
								id='role'
								name='role'
								placeholder='Defines the agent&apos;s function within the crew. It determines the kind of tasks the agent is best suited for.'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={role}
							/>
						</div>
						{/*<p className='mt-3 text-sm leading-6 text-gray-600'></p>*/}
					</div>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>

					<div className='col-span-full'>
						<label htmlFor='goal' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Goal
						</label>
						<div className='mt-2'>
							<textarea
								required
								id='goal'
								name='goal'
								placeholder='The individual objective that the agent aims to achieve. It guides the agent&apos;s decision-making process.'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={goal}
							/>
						</div>
						{/*<p className='mt-3 text-sm leading-6 text-gray-600'></p>*/}
					</div>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>

					<div className='col-span-full'>
						<label htmlFor='backstory' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Backstory
						</label>
						<div className='mt-2'>
							<textarea
								required
								id='backstory'
								name='backstory'
								placeholder='Provides context to the agent&apos;s role and goal, enriching the interaction and collaboration dynamics.'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={backstory}
							/>
						</div>
						{/*<p className='mt-3 text-sm leading-6 text-gray-600'></p>*/}
					</div>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>

					<div className='col-span-full'>
						<div className='mt-2'>
							<div className='sm:col-span-12'>
								<label htmlFor='allowDelegation' className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									<input
										type='checkbox'
										id='allowDelegation'
										name='allowDelegation'
										checked={allowDelegation}
										onChange={e => setAllowDelegation(e.target.checked)}
										className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
									/>
									Allow Delegation
								</label>
								<p className='mt-3 text-sm leading-6 text-gray-600'>Allow this agent to be assigned appropriate tasks automatically.</p>
							</div>
						</div>
					</div>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>

					<div className='col-span-full'>
						<div className='mt-2'>
							<div className='sm:col-span-12'>
								<label htmlFor='verbose' className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									<input
										type='checkbox'
										id='verbose'
										name='verbose'
										checked={verbose}
										onChange={e => setVerbose(e.target.checked)}
										className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
									/>
									Verbose
								</label>
								<p className='mt-3 text-sm leading-6 text-gray-600'>Enables detailed logging of the agent&apos;s execution for debugging or monitoring purposes when enabled.</p>
							</div>
						</div>
					</div>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='modelId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Model
						</label>
						<div className='mt-2'>
							<Select
								isClearable
					            primaryColor={'indigo'}
					            classNames={SelectClassNames}
					            value={foundModel ? { label: foundModel.name, value: foundModel._id } : null}
					            onChange={(v: any) => {
									if (v?.value === null) {
										setModalOpen('model');
										return setCallbackKey('modelId');
									}
					            	setAgent(oldAgent => {
  											return {
  												...oldAgent,
  												modelId: v?.value,
  											};
  										});
				            	}}
					            options={models.filter(m => !ModelEmbeddingLength[m.model]).map(c => ({ label: c.name, value: c._id })).concat([{ label: '+ New model', value: null }])}
					            formatOptionLabel={data => {
  										const optionCred = models.find(oc => oc._id === data.value);
					                return (<li
					                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
					                        data.isSelected
					                            ? 'bg-blue-100 text-blue-500'
					                            : 'dark:text-white'
					                    }`}
					                >
					                    {data.label} {optionCred ? `(${optionCred?.model})` : null}
					                </li>);
					            }}
					        />
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='modelId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Function Calling Model
						</label>
						<div className='mt-2'>
							<Select
								isClearable
					            primaryColor={'indigo'}
					            classNames={SelectClassNames}
					            value={foundFunctionModel ? { label: foundFunctionModel.name, value: foundFunctionModel._id } : null}
					            onChange={(v: any) => {
									if (v?.value === null) {
										setModalOpen('model');
										return setCallbackKey('functionModelId');
									}
					            	setAgent(oldAgent => {
										return {
											...oldAgent,
											functionModelId: v?.value,
										};
									});
				            	}}
					            options={models.filter(m => !ModelEmbeddingLength[m.model]).map(c => ({ label: c.name, value: c._id })).concat([{ label: '+ New model', value: null }])}
					            formatOptionLabel={data => {
  										const optionCred = models.find(oc => oc._id === data.value);
					                return (<li
					                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
					                        data.isSelected
					                            ? 'bg-blue-100 text-blue-500'
					                            : 'dark:text-white'
					                    }`}
					                >
					                    {data.label} {optionCred ? `(${optionCred?.model})` : null}
					                </li>);
					            }}
					        />
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='credentialId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Tools (Optional)
						</label>
						<div className='mt-2'>
							<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4'>
								{tools.map(tool => (
									<div
										key={tool._id}
										className={`tool-card flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-100 ${toolState.some(ts => ts.value === tool._id) ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'} transition-all`}
										onClick={() => handleToolSelect({ value: tool._id, ...tool })}
									>
										<span className='text-gray-800 text-sm font-medium'>{tool.name}</span>
										<span className={`text-blue-500 ${!toolState.some(ts => ts.value === tool._id) && 'invisible'}`}>✓</span>
									</div>
								))}
							</div>
							<button 
								className={`w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}
								onClick={(e) => {
									e.preventDefault();
									setModalOpen('tool');
								}}>
									+ New Tool
							</button>

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
