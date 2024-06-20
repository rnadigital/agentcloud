'use strict';

import * as API from '@api';
import {
	HandRaisedIcon,
} from '@heroicons/react/20/solid';
import CreateAgentModal from 'components/CreateAgentModal';
import CreateToolModal from 'components/CreateToolModal';
import ToolSelectIcons from 'components/ToolSelectIcons';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { ToolState } from 'struct/tool';
import SelectClassNames from 'styles/SelectClassNames';

export default function TaskForm({ task = {}, tools = [], agents = [], datasources = [], editing, compact = false, callback, fetchTaskFormData }
	: { task?: any, tools?: any[], agents?: any[], datasources?: any[], editing?: boolean, compact?: boolean, callback?: Function, fetchTaskFormData?: Function }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [modalOpen, setModalOpen]: any = useState(false);
	const { resourceSlug } = router.query;
	const [taskState, setTask] = useState(task);

	const { _id, name, description, expectedOutput, toolIds } = taskState;

	const initialTools = toolIds && toolIds
		.map(tid => {
			const foundTool = tools.find(t => t._id === tid);
			if (!foundTool) { return null; }
			return { label: foundTool.name, value: foundTool._id };
		})
		.filter(t => t);

	const preferredAgent = agents
		.find(a => a?._id === taskState?.agentId);

	useEffect(() => {
	    // Placeholder for any initial setup or effects
	}, []);

	async function taskPost(e) {
		e.preventDefault();
		const body: any = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			description: e.target.description.value,
			expectedOutput: e.target.expectedOutput.value,
			toolIds: taskState?.toolIds || [],
			agentId: taskState?.agentId || null,
			asyncExecution: false, //e.target.asyncExecution.checked,
			requiresHumanInput: e.target.requiresHumanInput.checked,
		};
		if (editing) {
			await API.editTask(taskState._id, body, () => {
				toast.success('Task Updated');
			}, (res) => {
				toast.error(res);
			}, null);
		} else {
			const addedTask: any = await API.addTask(body, () => {
				toast.success('Added new task');
			}, (res) => {
				toast.error(res);
			}, compact ? null : router);
			callback && addedTask && callback(addedTask._id);
		}
	}

	const toolCallback = async (addedToolId) => {
		await fetchTaskFormData && fetchTaskFormData();
		setModalOpen(false);
		setTask(oldTask => {
			return {
				...oldTask,
				toolIds: [...(taskState?.toolIds||[]), addedToolId],
			};
		});
	};

	const agentCallback = async (addedAgentId) => {
		await fetchTaskFormData && fetchTaskFormData();
		setModalOpen(false);
		setTask(oldTask => {
			return {
				...oldTask,
				agentId: addedAgentId,
			};
		});
	};

	return (
		<>
			{modalOpen === 'agent'
				? <CreateAgentModal open={modalOpen !== false} setOpen={setModalOpen} callback={agentCallback} />
				: <CreateToolModal open={modalOpen !== false} setOpen={setModalOpen} callback={toolCallback} />}
			<form onSubmit={taskPost}>
				<input
					type='hidden'
					name='_csrf'
					value={csrf}
				/>
				<div className={`space-y-${compact ? '6' : '12'}`}>
					<div className='grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3'>
						<div className='col-span-full'>
							<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Name<span className='text-red-700'> *</span>
							</label>
							<input
								required
								type='text'
								id='name'
								name='name'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={name}
							/>
						</div>

						<div className='col-span-full'>
							<label htmlFor='description' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Task Description<span className='text-red-700'> *</span>
							</label>
							<textarea
								required
								id='description'
								name='description'
								placeholder='A clear, concise statement of what the task entails.'
								rows={4}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={description}
							/>
						</div>

						<div className='col-span-full'>
							<label htmlFor='expectedOutput' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Expected Output
							</label>
							<textarea
								id='expectedOutput'
								name='expectedOutput'
								placeholder='Clear and detailed definition of expected output for the task.'
								rows={4}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={expectedOutput}
							/>
						</div>

						{/* Tool selection */}
						<div className='col-span-full'>
							<label htmlFor='toolIds' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Tools
							</label>
							<Select
								isSearchable
								isClearable
								isMultiple
								primaryColor={'indigo'}
								classNames={SelectClassNames}
								value={taskState?.toolIds?.map(x => ({ value: x, label: tools.find(tx => tx._id === x)?.name}))}
								onChange={(v: any) => {
									if (v?.some(vals => vals.value === null)) {
										//Create new pressed
										return setModalOpen('tool');
									}
									setTask(oldTask => {
										return {
											...oldTask,
											toolIds: v?.map(x => x.value),
										};
									});
								}}
								options={tools.map(t => ({ label: t.name, value: t._id })).concat([{ label: '+ New Tool', value: null }])}
					            formatOptionLabel={data => {
									const optionTool = tools.find(oc => oc._id === data.value);
					                return (<li
										className={`flex align-items-center !overflow-visible transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 overflow-visible ${
											data.isSelected
												? 'bg-blue-100 text-blue-500'
												: 'dark:text-white'
										}`}
									>
										<span className='tooltip z-100'>
											{ToolSelectIcons[optionTool?.type]}
											<span className='tooltiptext capitalize !w-[120px] !-ml-[60px]'>
												{optionTool?.type} tool
											</span>
										</span>
										<span className='ms-2 w-full overflow-hidden text-ellipsis'>{optionTool?.state} {data.label}{optionTool ? ` - ${optionTool?.data?.description || optionTool?.description}` : ''}</span>
									</li>);
					            }}
							/>
						</div>

						{/* Preferred agent */}
						<div className='col-span-full'>
							<label htmlFor='preferredAgent' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Preferred Agent
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
						            value={preferredAgent ? { label: preferredAgent.name, value: preferredAgent._id } : null}
						            onChange={(v: any) => {
										if (v?.value == null) {
											return setModalOpen('agent');
										}
										setTask(oldTask => {
											return {
												...oldTask,
												agentId: v?.value,
											};
										});
        						   	}}
						            options={agents
						            	.map(a => ({ label: a.name, value: a._id, allowDelegation: a.allowDelegation })) // map to options
						            	.concat([{ label: '+ Create new agent', value: null, allowDelegation: false }])} // append "add new"
						            formatOptionLabel={(data: any) => {
						            	const optionAgent = agents.find(ac => ac._id === data.value);
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
						
						{/* Async execution checkbox 
						<div className='col-span-full'>
							<div className='mt-2'>
								<div className='sm:col-span-12'>
									<label htmlFor='asyncExecution' className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
										<input
											type='checkbox'
											id='asyncExecution'
											name='asyncExecution'
											checked={taskState?.asyncExecution === true}
											onChange={e => {
												setTask(oldTask => {
													return {
														...oldTask,
														asyncExecution: e.target.checked,
													};
												});
											}}
											className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
										/>
										Async Execution
									</label>
								</div>
							</div>
						</div>*/}
						
						{/* human_input tool checkbox */}
						<div className='col-span-full'>
							<div className='mt-2'>
								<div className='sm:col-span-12'>
									<label htmlFor='requiresHumanInput' className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
										<input
											type='checkbox'
											id='requiresHumanInput'
											name='requiresHumanInput'
											checked={taskState?.requiresHumanInput === true}
											onChange={e => {
												setTask(oldTask => {
													return {
														...oldTask,
														requiresHumanInput: e.target.checked,
													};
												});
											}}
											className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
										/>
										Allow Human Input
									</label>
								</div>
							</div>
						</div>

					</div>
				</div>

				<div className='mt-6 flex items-center justify-between gap-x-6'>
					{!compact && <Link href={`/${resourceSlug}/tasks`}>
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
		</>
	);
}
