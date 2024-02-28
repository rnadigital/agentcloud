'use strict';

import * as API from '@api';
import CreateModelModal from 'components/CreateModelModal';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { DatasourceStatus } from 'struct/datasource';
import { ModelEmbeddingLength, ModelList } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

export default function AgentForm({ agent = {}, models = [], tools=[], datasources=[], groups=[], editing, compact=false, callback, fetchAgentFormData }
	: { agent?: any, models?: any[], tools?: any[], datasources?: any[], groups?: any[], editing?: boolean, compact?: boolean, callback?: Function, fetchAgentFormData?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen] = useState(false);
	const [callbackKey, setCallbackKey] = useState(null);
	const [allowDelegation, setAllowDelegation] = useState(agent.allowDelegation || false);
	const [agentState, setAgent] = useState(agent);
	const [error, setError] = useState();
	const { verifysuccess } = router.query;

	const { _id, name, modelId, functionModelId, toolIds, datasourceIds, role, goal, backstory } = agentState;
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

	const initialDatasources = agent.datasourceIds && agent.datasourceIds
		.map(did => {
			const foundSource = datasources.find(d => d._id === did);
			if (!foundSource) { return null; }
			return { label: `${foundSource.name} (${foundSource.originalName})`, value: foundSource._id, ...foundSource };
		})
		.filter(t => t);
	const [datasourcesState, setDatasourcesState] = useState(initialDatasources || []);

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
			role: e.target.role.value,
			goal: e.target.goal.value,
			backstory: e.target.backstory.value,
			toolIds: toolState ? toolState.map(t => t.value) : [],
			datasourceIds: datasourcesState ? datasourcesState.map(d => d.value) : [],
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

	return (<>
		<CreateModelModal open={modalOpen} setOpen={setModalOpen} callback={modelCallback} />
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
								rows={5}
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
								rows={5}
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
								rows={5}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={goal}
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
										setModalOpen(true);
										return setCallbackKey('modelId');
									}
					            	setAgent(oldAgent => {
  											return {
  												...oldAgent,
  												modelId: v?.value,
  											};
  										});
				            	}}
					            options={models.filter(m => !ModelEmbeddingLength[m.model]).map(c => ({ label: c.name, value: c._id })).concat([{ label: '+ Create new model', value: null }])}
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
										setModalOpen(true);
										return setCallbackKey('functionModelId');
									}
					            	setAgent(oldAgent => {
  											return {
  												...oldAgent,
  												functionModelId: v?.value,
  											};
  										});
				            	}}
					            options={models.filter(m => !ModelEmbeddingLength[m.model]).map(c => ({ label: c.name, value: c._id })).concat([{ label: '+ Create new model', value: null }])}
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
							Datasources (Optional)
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
					            value={datasourcesState}
					            onChange={(v: any) => {
					            	console.log(v);
					            	setDatasourcesState(v);
				            	}}
					            options={datasources
					            	.filter(t => t?.status === DatasourceStatus.READY)
					            	.map(t => ({ label: `${t.name} (${t.originalName})`, value: t._id, ...t }))}
					            formatOptionLabel={(data: any) => {
					                return (<li
					                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
					                        data.isSelected
					                            ? 'bg-blue-100 text-blue-500'
					                            : 'dark:text-white'
					                    }`}
					                >
					                    <span>
											<img
												src={`https://connectors.airbyte.com/files/metadata/airbyte/source-${data.sourceType}/latest/icon.svg`}
												loading='lazy'
												className='inline-flex me-2 w-4 h-4'
											/>
											{data.label}
										</span>
					                </li>);
					            }}
					        />
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
