'use strict';

import * as API from '@api';
import { Switch } from '@headlessui/react';
import { HandRaisedIcon } from '@heroicons/react/20/solid';
import CreateAgentModal from 'components/CreateAgentModal';
import CreateToolModal from 'components/modal/CreateToolModal';
import ToolsSelect from 'components/tools/ToolsSelect';
import { log } from 'console';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { NotificationType } from 'struct/notification';
import { FormFieldConfig, Task } from 'struct/task';
import { ToolType } from 'struct/tool';

import CreateDatasourceModal from './CreateDatasourceModal';
import CreateTaskModal from './CreateTaskModal';
import ScriptEditor, { MonacoOnInitializePane } from './Editor';
import FormConfig from './FormConfig';
import InfoAlert from './InfoAlert';
import ToolTip from './shared/ToolTip';

const jsonPlaceholder = `{
	"schema": {
		"name": {
			"type": "string"
		},
		"age": {
			"type": "number"
		},
		"address": {
			"type": "object",
			"schema": {
				"street": {
					"type": "string"
				},
				"city": {
					"type": "string"
				},
				"state": {
					"type": "string"
				}
			}
		}
	}
}`;

export default function TaskForm({
	task,
	tools = [],
	agents = [],
	editing,
	compact = false,
	callback,
	fetchTaskFormData,
	taskChoices = []
}: {
	task?: Task;
	tools?: any[];
	agents?: any[];
	editing?: boolean;
	compact?: boolean;
	callback?: Function;
	fetchTaskFormData?: Function;
	taskChoices?: Task[];
}) {
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [taskState, setTask] = useState<Task | undefined>(task);
	const [expectedOutput, setExpectedOutput] = useState<string>(task?.expectedOutput);

	const [isStructuredOutput, setIsStructuredOutput] = useState(task?.isStructuredOutput);

	const [formFields, setFormFields] = useState<Partial<FormFieldConfig>[]>(
		task?.formFields || [
			{
				position: '1',
				type: 'string'
			}
		]
	);

	const [, notificationTrigger]: any = useSocketContext();
	const posthog = usePostHog();
	const requiredHumanInput = taskState?.requiresHumanInput;

	const preferredAgent = agents.find(a => a?._id === taskState?.agentId);
	const [showToolConflictWarning, setShowToolConflictWarning] = useState(false);

	const onInitializePane: MonacoOnInitializePane = (monacoEditorRef, editorRef, model) => {
		/* noop */
	};

	const getInitialTools = (acc, tid) => {
		const foundTool = tools.find(t => t._id === tid);
		if (!foundTool) {
			return acc;
		}
		const toolVal = { label: foundTool.name, value: foundTool._id };
		if ((foundTool?.type as ToolType) !== ToolType.RAG_TOOL) {
			acc.initialTools.push(toolVal);
		} else {
			acc.initialDatasources.push(toolVal);
		}
		return acc;
	};

	const { initialTools, initialDatasources } = (task?.toolIds || []).reduce(getInitialTools, {
		initialTools: [],
		initialDatasources: []
	});
	const [toolState, setToolState] = useState(initialTools.length > 0 ? initialTools : null);
	const [datasourceState, setDatasourceState] = useState(
		initialDatasources.length > 0 ? initialDatasources : null
	); //Note: still technically tools, just only RAG tools

	async function createDatasourceCallback(createdDatasource) {
		(await fetchTaskFormData) && fetchTaskFormData();
		setDatasourceState({ label: createdDatasource.name, value: createdDatasource.datasourceId });
		setModalOpen(false);
	}
	const [modalOpen, setModalOpen]: any = useState(false);
	async function taskPost(e) {
		e.preventDefault();
		const toolIds = toolState ? toolState.map(x => x?.value) : [];
		const datasourceIds = datasourceState ? datasourceState.map(x => x?.value) : [];
		const dedupedCombinedToolIds = [...new Set([...toolIds, ...datasourceIds])];

		const displayOnlyFinalOutput =
			taskState?.requiresHumanInput && (!formFields || formFields.length === 0)
				? false
				: taskState.displayOnlyFinalOutput;

		const body: any = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.task_name.value,
			description: e.target.task_description.value,
			expectedOutput,
			toolIds: dedupedCombinedToolIds || [],
			agentId: taskState?.agentId || null,
			asyncExecution: false, //e.target.asyncExecution.checked,
			requiresHumanInput: taskState?.requiresHumanInput || null,
			context: taskState?.context || [],
			formFields: formFields || [],
			displayOnlyFinalOutput,
			storeTaskOutput: e.target.storeTaskOutput.checked,
			taskOutputFileName: e.target.taskOutputFileName?.value,
			isStructuredOutput
		};
		const posthogEvent = editing ? 'updateTask' : 'createTask';
		if (editing) {
			await API.editTask(
				taskState._id,
				body,
				() => {
					posthog.capture(posthogEvent, {
						name: e.target.task_name.value,
						id: taskState?._id,
						toolIds: taskState?.toolIds || [],
						preferredAgentId: taskState?.agentId,
						context: taskState?.context || []
					});
					toast.success('Task Updated');
				},
				res => {
					posthog.capture(posthogEvent, {
						name: e.target.task_name.value,
						id: taskState?._id,
						toolIds: taskState?.toolIds || [],
						preferredAgentId: taskState?.agentId,
						context: taskState?.context || [],
						error: res
					});
					toast.error(res);
				},
				null
			);
		} else {
			const addedTask: any = await API.addTask(
				body,
				() => {
					posthog.capture(posthogEvent, {
						name: e.target.task_name.value,
						id: taskState?._id,
						toolIds: taskState?.toolIds || [],
						preferredAgentId: taskState?.agentId,
						context: taskState?.context || []
					});
					toast.success('Added new task');
				},
				res => {
					posthog.capture(posthogEvent, {
						name: e.target.task_name.value,
						id: taskState?._id,
						toolIds: taskState?.toolIds || [],
						preferredAgentId: taskState?.agentId,
						context: taskState?.context || [],
						error: res
					});
					toast.error(res);
				},
				compact ? null : router
			);
			callback && addedTask && callback(addedTask._id, body);
		}
	}

	const toolCallback = async (addedToolId, body) => {
		(await fetchTaskFormData) && fetchTaskFormData();
		setModalOpen(false);
		setTask(oldTask => {
			return {
				...oldTask,
				toolIds: [...(taskState?.toolIds || []), addedToolId]
			};
		});
	};
	const agentCallback = async addedAgentId => {
		(await fetchTaskFormData) && fetchTaskFormData();
		setModalOpen(false);
		setTask(oldTask => {
			return {
				...oldTask,
				agentId: addedAgentId
			};
		});
	};

	async function createTaskCallback() {
		(await fetchTaskFormData) && fetchTaskFormData();
		setModalOpen(false);
	}

	useEffect(() => {
		if (notificationTrigger && notificationTrigger?.type === NotificationType.Tool) {
			fetchTaskFormData();
		}
	}, [resourceSlug, notificationTrigger]);

	useEffect(() => {
		setTask(task);
		const { initialTools, initialDatasources } = (task?.toolIds || []).reduce(getInitialTools, {
			initialTools: [],
			initialDatasources: []
		});
		setDatasourceState(initialDatasources.length > 0 ? initialDatasources : null);
		setToolState(initialTools.length > 0 ? initialTools : null);
	}, [task?._id]);

	useEffect(() => {
		if (preferredAgent?.toolIds?.length > 0) {
			setShowToolConflictWarning(true);
		} else {
			setShowToolConflictWarning(false);
		}
	}, [preferredAgent?.toolIds]);

	useEffect(() => {
		if (!expectedOutput && isStructuredOutput === true) {
			setExpectedOutput(jsonPlaceholder);
		}
		if (expectedOutput === jsonPlaceholder && isStructuredOutput === false) {
			setExpectedOutput('');
		}
	}, [expectedOutput, isStructuredOutput]);

	let modal;
	switch (modalOpen) {
		case 'datasource':
			modal = (
				<CreateDatasourceModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={createDatasourceCallback}
					initialStep={0}
				/>
			);
			break;
		case 'task':
			modal = (
				<CreateTaskModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={createTaskCallback}
				/>
			);
			break;

		case 'agent':
			modal = (
				<CreateAgentModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={agentCallback}
				/>
			);
			break;

		default:
			modal = (
				<CreateToolModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={toolCallback}
				/>
			);
			break;
	}

	return (
		<>
			{modal}
			<form onSubmit={taskPost}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className={`space-y-${compact ? '6' : '12'}`}>
					<div className='grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3'>
						<div className='col-span-full'>
							<label
								htmlFor='task_name'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Name<span className='text-red-700'> *</span>
							</label>
							<input
								required
								type='text'
								id='task_name'
								name='task_name'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={taskState?.name}
							/>
						</div>

						<div className='col-span-full'>
							<label
								htmlFor='task_description'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Task Description<span className='text-red-700'> *</span>
							</label>
							<textarea
								required
								id='task_description'
								name='task_description'
								placeholder='A clear, concise statement of what the task entails.'
								rows={4}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={taskState?.description}
							/>
						</div>

						<div className='col-span-full'>
							<div className='flex w-full mb-2 items-center'>
								<label
									htmlFor='expectedOutput'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
								>
									Expected Output<span className='text-red-700'> *</span>
								</label>

								<div className='ml-auto text-gray-900 dark:text-gray-50 text-sm mr-2'>
									Structured Output
								</div>
								<Switch
									checked={isStructuredOutput}
									onChange={setIsStructuredOutput}
									className='group inline-flex h-5 w-11 items-center rounded-full bg-gray-400 transition data-[checked]:bg-blue-600'
								>
									<span className='size-3 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6' />
								</Switch>
							</div>

							{isStructuredOutput ? (
								<>
									<ScriptEditor
										height='30em'
										code={expectedOutput}
										setCode={setExpectedOutput}
										editorOptions={{
											stopRenderingLineAfter: 1000,
											fontSize: '12pt',
											//@ts-ignore because minimap is a valid option and I don't care what typescript thinks
											minimap: { enabled: false },
											scrollBeyondLastLine: false
										}}
										onInitializePane={onInitializePane}
										language='json'
									/>
									<a
										className='text-sm text-blue-500 dark:text-blue-400 underline'
										href='https://docs.agentcloud.dev/documentation/guides/structure-output'
										target='_blank'
										rel='noreferrer'
									>
										Instructions on how to create a schema for structure output
									</a>
								</>
							) : (
								<textarea
									id='expectedOutput'
									name='expectedOutput'
									placeholder='Clear and detailed definition of expected output for the task.'
									rows={4}
									className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									defaultValue={taskState?.expectedOutput}
									value={expectedOutput}
									onChange={e => setExpectedOutput(e.target.value)}
								/>
							)}
						</div>

						<div className='sm:col-span-full'>
							<label
								htmlFor='members'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Context
							</label>
							<div className='mt-2'>
								<Select
									isMultiple
									isSearchable
									isClearable
									primaryColor={'indigo'}
									classNames={{
										menuButton: () =>
											'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) =>
											`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`
									}}
									value={
										taskState?.context?.length > 0
											? taskState?.context?.map(x => ({
													value: x.toString(),
													label: taskChoices.find(tx => tx._id === x)?.name
												}))
											: null
									}
									onChange={(v: any) => {
										if (v?.some(val => val?.disabled)) {
											return;
										}
										if (v?.some(vals => vals.value === null)) {
											return setModalOpen('task');
										}
										setTask(oldTask => {
											return {
												...oldTask,
												context: v?.map(x => x.value)
											};
										});
									}}
									options={[{ label: '+ New task', value: null }].concat(
										taskChoices.map(a => ({ label: a.name, value: a._id }))
									)}
									formatOptionLabel={(data: any) => {
										const optionTask = taskChoices.find(tc => tc._id === data.value);
										return (
											<li
												className={`transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
													data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
												}`}
											>
												{data.label}
												{optionTask ? ` (${optionTask.description})` : null}
											</li>
										);
									}}
								/>
							</div>
						</div>

						{/* Tool selection */}
						<div className='col-span-full'>
							<ToolsSelect
								tools={tools.filter(t => (t?.type as ToolType) !== ToolType.RAG_TOOL)}
								toolState={toolState}
								onChange={toolState => setToolState(toolState)}
								setModalOpen={setModalOpen}
							/>

							<ToolsSelect
								title='Datasources'
								addNewTitle='+ New Datasource'
								tools={tools.filter(t => (t?.type as ToolType) === ToolType.RAG_TOOL)}
								toolState={datasourceState}
								onChange={setDatasourceState}
								setModalOpen={x => setModalOpen('datasource')}
								enableAddNew={true}
							/>
						</div>

						{showToolConflictWarning && (
							<InfoAlert
								textColor='black'
								className='col-span-full bg-yellow-100 text-yellow-900 p-4 text-sm rounded-md'
								message='Agent Tool Conflict Warning'
							>
								We noticed you have added an agent with a tool associated to them. Please note,
								since the tools are associated to the agents, they can be used on any task where the
								agent is working. If you would like a more deterministic approach, please only
								associate the tool to the task.
							</InfoAlert>
						)}

						{/* Preferred agent */}
						<div className='col-span-full'>
							<label
								htmlFor='preferredAgent'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Preferred Agent
							</label>
							<div className='mt-2'>
								<Select
									isClearable
									isSearchable
									primaryColor={'indigo'}
									classNames={{
										menuButton: () =>
											'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) =>
											`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`
									}}
									value={
										preferredAgent
											? { label: preferredAgent.name, value: preferredAgent._id }
											: null
									}
									onChange={(v: any) => {
										/* Note: using a unique non objectid valud e.g. "new" instead of null because
										   isClearable selects that aren't isMultiple have an empty value of null, which conflicts
										   and triggers the new modal every time the input is cleared */
										if (v?.value == 'new') {
											return setModalOpen('agent');
										}
										setTask(oldTask => {
											return {
												...oldTask,
												agentId: v?.value
											};
										});
									}}
									options={[
										{ label: '+ Create new agent', value: 'new', allowDelegation: false }
									].concat(
										agents.map(a => ({
											label: a.name,
											value: a._id,
											allowDelegation: a.allowDelegation
										}))
									)}
									formatOptionLabel={(data: any) => {
										const optionAgent = agents.find(ac => ac._id === data.value);
										return (
											<li
												className={`transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
													data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
												}`}
											>
												{data.label}
												{optionAgent ? ` - ${optionAgent.role}` : null}
												{data.allowDelegation && (
													<span className='tooltip z-100'>
														<span className='h-5 w-5 inline-flex items-center rounded-full bg-green-100 mx-1 px-2 py-1 text-xs font-semibold text-green-700'>
															<HandRaisedIcon className='h-3 w-3 absolute -ms-1' />
														</span>
														<span className='tooltiptext'>
															This agent allows automatic task delegation.
														</span>
													</span>
												)}
											</li>
										);
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

						<div className='col-span-full'>
							<ToolTip
								content='Use human input when the task description and expected output require a human response instead of an AI response. This input will be used for the next task in a process app.'
								placement='top-start'
								arrow={false}
							>
								<div className='mt-2'>
									<div className='sm:col-span-12'>
										<label
											htmlFor='requiresHumanInput'
											className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
										>
											Human Input
										</label>
										<Select
											primaryColor='indigo'
											value={
												requiredHumanInput
													? formFields?.length > 0
														? { label: 'Human Input - Form input', value: 'form' }
														: { label: 'Human Input - Free text feedback to AI', value: 'freeText' }
													: { label: 'Human Input - OFF', value: 'off' }
											}
											onChange={(v: any) => {
												setTask(oldTask => ({
													...oldTask,
													requiresHumanInput: v.value !== 'off'
												}));
												if (v.value === 'form') {
													setFormFields(
														task?.formFields?.length > 0
															? task.formFields
															: [{ position: '1', type: 'string' }]
													);
												} else {
													setFormFields(null);
												}
											}}
											options={[
												{ label: 'Human Input - OFF', value: 'off' },
												{ label: 'Human Input - Free text feedback to AI', value: 'freeText' },
												{ label: 'Human Input - Form input', value: 'form' }
											]}
											classNames={{
												menuButton: () =>
													'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
												menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
												list: 'dark:bg-slate-700',
												listGroupLabel: 'dark:bg-slate-700',
												listItem: (value?: { isSelected?: boolean }) =>
													`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`
											}}
										/>
									</div>
								</div>
							</ToolTip>
						</div>

						{/* Form builder for human input */}
						{requiredHumanInput && formFields?.length > 0 && (
							<div className='col-span-full'>
								<FormConfig formFields={formFields} setFormFields={setFormFields} />
							</div>
						)}

						{/* displayOnlyFinalOutput tool checkbox */}
						<div className='col-span-full'>
							<ToolTip
								content='Hides intermediate thought messages from agents and only display the final task output.'
								placement='top-start'
								arrow={false}
							>
								<div className='mt-2'>
									<div className='sm:col-span-12'>
										<label
											htmlFor='displayOnlyFinalOutput'
											className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
										>
											<input
												type='checkbox'
												id='displayOnlyFinalOutput'
												name='displayOnlyFinalOutput'
												disabled={
													taskState?.requiresHumanInput && (!formFields || formFields.length === 0)
												}
												checked={
													taskState?.requiresHumanInput && (!formFields || formFields.length === 0)
														? false
														: taskState?.displayOnlyFinalOutput === true
												}
												onChange={e => {
													setTask(oldTask => {
														return {
															...oldTask,
															displayOnlyFinalOutput: e.target.checked
														};
													});
												}}
												className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:bg-gray-500'
											/>
											Display Only Final Output
										</label>
									</div>
								</div>
							</ToolTip>
						</div>

						<div className='col-span-full'>
							<ToolTip
								content='Stores the task output in a file that can be downloaded by the user after the task is completed.'
								placement='top-start'
								arrow={false}
							>
								<div className='mt-2'>
									<div className='sm:col-span-12'>
										<label
											htmlFor='storeTaskOutput'
											className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
										>
											<input
												type='checkbox'
												id='storeTaskOutput'
												name='storeTaskOutput'
												checked={taskState?.storeTaskOutput === true}
												onChange={e => {
													setTask(oldTask => {
														return {
															...oldTask,
															storeTaskOutput: e.target.checked
														};
													});
												}}
												className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
											/>
											Store Task Output
										</label>
									</div>
								</div>
							</ToolTip>
						</div>

						{taskState?.storeTaskOutput && (
							<ToolTip
								content='Task output file name can only be .txt or .csv'
								placement='top-start'
								arrow={false}
							>
								<div className='col-span-full'>
									<label
										htmlFor='name'
										className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
									>
										Task Output File Name<span className='text-red-700'> *</span>
									</label>
									<input
										required
										type='text'
										id='taskOutputFileName'
										name='taskOutputFileName'
										className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
										defaultValue={taskState?.taskOutputFileName}
									/>
								</div>
							</ToolTip>
						)}
					</div>
				</div>

				<div className='mt-6 flex items-center justify-between gap-x-6 dark:text-indigo-200'>
					{!compact && <Link href={`/${resourceSlug}/tasks`}>Back</Link>}
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
