'use strict';

import * as API from '@api';
import { Switch } from '@headlessui/react';
import { HandRaisedIcon } from '@heroicons/react/20/solid';
import CreateAgentModal from 'components/CreateAgentModal';
import CreateToolModal from 'components/modal/CreateToolModal';
import ToolsSelect from 'components/tools/ToolsSelect';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import { TasksDataReturnType } from 'controllers/task';
import useAutocompleteDropdown from 'hooks/useAutoCompleteDropdown';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import SelectOld from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { NotificationType } from 'struct/notification';
import { FormFieldConfig, Task } from 'struct/task';
import { ToolType } from 'struct/tool';

import { StructuredOutputSchema } from '../lib/struct/editorschemas';
import CreateDatasourceModal from './CreateDatasourceModal';
import CreateTaskModal from './CreateTaskModal';
import ScriptEditor, { MonacoOnInitializePane } from './Editor';
import FormConfig from './FormConfig';
import InfoAlert from './InfoAlert';
import ToolTip from './shared/ToolTip';
import CreateVariableModal from './variables/CreateVariableModal';
import AutocompleteDropdown from './variables/VariableDropdown';
import { Input } from 'modules/components/ui/input';
import { Textarea } from 'modules/components/ui/textarea';
import { MultiSelect } from 'modules/components/multi-select';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';
import { Database, PlusCircleIcon, User } from 'lucide-react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

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
	variables = [],
	editing,
	compact = false,
	callback,
	fetchTaskFormData,
	taskChoices = []
}: {
	task?: TasksDataReturnType['tasks']['0'];
	tools?: TasksDataReturnType['tools'];
	agents?: TasksDataReturnType['agents'];
	variables?: TasksDataReturnType['variables'];
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
	const [taskState, setTask] = useState<Task>(task);
	const [expectedOutput, setExpectedOutput] = useState<string>(task?.expectedOutput);
	const [isStructuredOutput, setIsStructuredOutput] = useState(task?.isStructuredOutput);
	const [modalOpen, setModalOpen] = useState<string>();
	const [currentInput, setCurrentInput] = useState<string>();

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
	const taskOutputVariable = variables.find(v => v.name === taskState?.taskOutputVariableName);
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

	const [descriptionSelectedVariables, setDescriptionSelectedVariables] = useState<string[]>([]);
	const [expectedOutputSelectedVariables, setExpectedOutputSelectedVariables] =
		useState<string[]>();

	const descriptionVariableOptions = variables.map(v => ({
		label: v.name,
		value: v._id.toString()
	}));

	const expectedOutputVariableOptions = variables.map(v => ({
		label: v.name,
		value: v._id.toString()
	}));

	const [description, setDescription] = useState(task?.description || '');

	const autocompleteDescription = useAutocompleteDropdown({
		value: description,
		options: descriptionVariableOptions,
		setValue: setDescription,
		setSelectedVariables: setDescriptionSelectedVariables,
		setModalOpen,
		initialState: variables,
		setCurrentInput,
		fetchFormData: fetchTaskFormData
	});

	const autocompleteExpectedOutput = useAutocompleteDropdown({
		value: expectedOutput,
		options: expectedOutputVariableOptions,
		setValue: setExpectedOutput,
		setSelectedVariables: setExpectedOutputSelectedVariables,
		setModalOpen,
		initialState: variables,
		setCurrentInput,
		fetchFormData: fetchTaskFormData
	});

	const handleNewVariableCreation = (newVariable: { label: string; value: string }) => {
		switch (currentInput) {
			case 'task_description':
				autocompleteDescription.handleNewVariableCreation(newVariable);
				break;
			case 'expectedOutput':
				autocompleteExpectedOutput.handleNewVariableCreation(newVariable);
				break;
			default:
				setTask(oldTask => {
					return {
						...oldTask,
						taskOutputVariableName: newVariable.label
					};
				});
				fetchTaskFormData();
				setModalOpen(null);
				break;
		}
	};

	async function createDatasourceCallback(createdDatasource) {
		(await fetchTaskFormData) && fetchTaskFormData();
		setDatasourceState({ label: createdDatasource.name, value: createdDatasource.datasourceId });
		setModalOpen(null);
	}
	async function taskPost(e) {
		e.preventDefault();
		const toolIds = toolState ? toolState : [];
		const datasourceIds = datasourceState ? datasourceState : [];
		const dedupedCombinedToolIds = [...new Set([...toolIds, ...datasourceIds])];
		const displayOnlyFinalOutput =
			taskState?.requiresHumanInput && (!formFields || formFields.length === 0)
				? false
				: taskState?.displayOnlyFinalOutput;

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
			isStructuredOutput,
			variableIds:
				Array.from(
					new Set([...descriptionSelectedVariables, ...expectedOutputSelectedVariables])
				) || [],
			taskOutputVariableName: taskState?.taskOutputVariableName || null
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
		setModalOpen(null);
		setTask(oldTask => {
			return {
				...oldTask,
				toolIds: [...(taskState?.toolIds || []), addedToolId]
			};
		});
	};
	const agentCallback = async addedAgentId => {
		(await fetchTaskFormData) && fetchTaskFormData();
		setModalOpen(null);
		setTask(oldTask => {
			return {
				...oldTask,
				agentId: addedAgentId
			};
		});
	};

	async function createTaskCallback() {
		(await fetchTaskFormData) && fetchTaskFormData();
		setModalOpen(null);
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
					open={Boolean(modalOpen)}
					setOpen={setModalOpen}
					callback={createDatasourceCallback}
					initialStep={0}
				/>
			);
			break;
		case 'task':
			modal = (
				<CreateTaskModal
					open={Boolean(modalOpen)}
					setOpen={setModalOpen}
					callback={createTaskCallback}
				/>
			);
			break;

		case 'agent':
			modal = (
				<CreateAgentModal
					open={Boolean(modalOpen)}
					setOpen={setModalOpen}
					callback={agentCallback}
				/>
			);
			break;

		case 'variable':
			modal = (
				<CreateVariableModal
					open={Boolean(modalOpen)}
					setOpen={setModalOpen}
					callback={handleNewVariableCreation}
				/>
			);
			break;

		default:
			modal = (
				<CreateToolModal open={Boolean(modalOpen)} setOpen={setModalOpen} callback={toolCallback} />
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
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Name<span className='text-red-700'> *</span>
							</label>
							<Input
								required
								type='text'
								id='task_name'
								name='task_name'
								defaultValue={taskState?.name}
								placeholder='A concise name that summarizes the task purpose'
							/>
						</div>

						<div className='col-span-full'>
							<label
								htmlFor='task_description'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Task Description<span className='text-red-700'> *</span>
							</label>
							<Textarea
								ref={autocompleteDescription.inputRef}
								value={description}
								onChange={autocompleteDescription.handleChange}
								onKeyDown={autocompleteDescription.handleKeyDown}
								required
								id='task_description'
								name='task_description'
								placeholder='A clear, concise statement of what the task entails.'
								rows={4}
								defaultValue={taskState?.description}
							/>
							{autocompleteDescription.showDropdown &&
								autocompleteDescription.filteredOptions.length > 0 && (
									<AutocompleteDropdown
										options={autocompleteDescription.filteredOptions}
										highlightedIndex={autocompleteDescription.highlightedIndex}
										dropdownPosition={autocompleteDescription.dropdownPosition}
										handleOptionSelect={autocompleteDescription.handleOptionSelect}
										closeDropdown={autocompleteDescription.closeDropdown}
									/>
								)}
						</div>

						<div className='col-span-full'>
							<div className='flex w-full mb-2 items-center'>
								<label
									htmlFor='expectedOutput'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Expected Output<span className='text-red-700'> *</span>
								</label>

								<div className='ml-auto text-gray-900 dark:text-gray-50 text-sm mr-2'>
									Structured Output
								</div>
								<Switch
									checked={isStructuredOutput}
									onChange={setIsStructuredOutput}
									className='group inline-flex h-5 w-11 items-center rounded-full bg-gray-400 transition data-[checked]:bg-blue-600'>
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
										editorJsonSchema={StructuredOutputSchema}
										language='json'
									/>
									<a
										className='text-sm text-blue-500 dark:text-blue-400 underline'
										href='https://docs.agentcloud.dev/documentation/guides/structure-output'
										target='_blank'
										rel='noreferrer'>
										Instructions on how to create a schema for structure output
									</a>
								</>
							) : (
								<Textarea
									ref={autocompleteExpectedOutput.inputRef}
									id='expectedOutput'
									name='expectedOutput'
									placeholder='Clear and detailed definition of expected output for the task.'
									rows={4}
									defaultValue={taskState?.expectedOutput}
									value={autocompleteExpectedOutput.text}
									onChange={autocompleteExpectedOutput.handleChange}
									onKeyDown={autocompleteExpectedOutput.handleKeyDown}
								/>
							)}
							{autocompleteExpectedOutput.showDropdown &&
								autocompleteExpectedOutput.filteredOptions.length > 0 && (
									<AutocompleteDropdown
										options={autocompleteExpectedOutput.filteredOptions}
										highlightedIndex={autocompleteExpectedOutput.highlightedIndex}
										dropdownPosition={autocompleteExpectedOutput.dropdownPosition}
										handleOptionSelect={autocompleteExpectedOutput.handleOptionSelect}
										closeDropdown={autocompleteExpectedOutput.closeDropdown}
									/>
								)}
						</div>

						<div className='p-6 bg-gray-100 rounded-md text-sm col-span-full '>
							<div>Optimize Your Task Execution</div>
							<div className='text-gray-600 mt-2'>
								Assign the most suitable agent and equip them with the necessary tools and data to
								ensure your task is executed efficiently.
							</div>

							{/* Tool selection */}
							<MultiSelect
								className='bg-white mt-4'
								placeholder={
									<div className='flex items-center gap-2'>
										<Database className='h-4 w-4' />
										<p>Tools</p>
									</div>
								}
								newCallback={() => setModalOpen('datasource')}
								newLabel='New Datasource'
								options={tools
									.filter(t => (t?.type as ToolType) !== ToolType.RAG_TOOL)
									.map(t => ({
										label: t.name,
										value: t._id.toString()
									}))}
								onValueChange={values => setToolState(values)}
								value={toolState}
							/>

							{/* Tool selection */}
							<MultiSelect
								className='bg-white mt-4'
								placeholder={
									<div className='flex items-center gap-2'>
										<Database className='h-4 w-4' />
										<p>Connections</p>
									</div>
								}
								newCallback={() => setModalOpen('datasource')}
								newLabel='New Datasource'
								options={tools
									.filter(t => (t?.type as ToolType) === ToolType.RAG_TOOL)
									.map(t => ({
										label: t.name,
										value: t._id.toString()
									}))}
								onValueChange={values => {
									setDatasourceState(values);
								}}
								value={datasourceState}
							/>

							{/* Preferred agent */}
							<Select
								value={preferredAgent?._id.toString()}
								onValueChange={value => {
									if (value == 'new') {
										return setModalOpen('agent');
									}
									if (value) {
										setTask(oldTask => {
											return {
												...oldTask,
												agentId: value
											};
										});
									}
								}}>
								<SelectTrigger className='bg-white mt-4'>
									<SelectValue
										placeholder={
											<div className='flex items-center gap-2 text-gray-600'>
												<User className='h-4 w-4' />
												<p>Agent</p>
											</div>
										}
									/>
								</SelectTrigger>
								<SelectContent className='bg-white'>
									<SelectItem value='new'>
										<div className='flex items-center w-full'>
											<PlusCircleIcon className='h-4 w-4 mr-2' />
											Create new agent
										</div>
									</SelectItem>
									{agents.map(a => (
										<SelectItem key={a._id.toString()} value={a._id.toString()}>
											{a.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{showToolConflictWarning && (
								<InfoAlert
									textColor='black'
									className='col-span-full bg-yellow-100 text-yellow-900 p-4 text-sm rounded-md mt-3'
									message='Agent Tool Conflict Warning'>
									We noticed you have added an agent with a tool associated to them. Please note,
									since the tools are associated to the agents, they can be used on any task where
									the agent is working. If you would like a more deterministic approach, please only
									associate the tool to the task.
								</InfoAlert>
							)}
						</div>

						<div className='p-6 bg-gray-100 rounded-md text-sm col-span-full '>
							<div>Context Tasks</div>
							<div className='text-gray-600 mt-2'>
								Select any existing tasks that provide relevant background or are prerequisites
							</div>

							<MultiSelect
								className='bg-white mt-4'
								placeholder={
									<div className='flex items-center gap-2'>
										<WrenchScrewdriverIcon className='h-4 w-4' />
										<p>Tasks</p>
									</div>
								}
								options={taskChoices.map(a => ({ label: a.name, value: a._id.toString() }))}
								onValueChange={values => {
									setTask(oldTask => {
										return {
											...oldTask,
											context: values
										};
									});
								}}
							/>
						</div>

						<div className='p-6 bg-gray-100 rounded-md text-sm col-span-full '>
							<div>User Input Questions</div>
							<div className='text-gray-600 mt-2'>
								Specify the questions or fields to gather input from the user during this task.
							</div>

							{/* Commenting out tooltip for human input */}
							{/*<ToolTip
								content='Use human input when the task description and expected output require a human response instead of an AI response. This input will be used for the next task in a process app.'
								placement='top-start'
								arrow={false}>*/}
							<Select
								value={requiredHumanInput ? (formFields?.length > 0 ? 'form' : 'freeText') : 'off'}
								onValueChange={value => {
									setTask(oldTask => ({
										...oldTask,
										requiresHumanInput: value !== 'off',
										...(value === 'off' || value === 'form' ? { taskOutputVariableName: null } : {})
									}));
									if (value === 'form') {
										setFormFields(
											task?.formFields?.length > 0
												? task.formFields
												: [{ position: '1', type: 'string' }]
										);
									} else {
										setFormFields(null);
									}
								}}>
								<SelectTrigger className='bg-white mt-2'>
									<SelectValue placeholder='Select a human input type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='off'>Human Input - OFF</SelectItem>
									<SelectItem value='freeText'>Human Input - Free text feedback to AI</SelectItem>
									<SelectItem value='form'>Human Input - Form input</SelectItem>
								</SelectContent>
							</Select>
							{/*</ToolTip>*/}

							{/* Form builder for human input */}
							{requiredHumanInput && formFields?.length > 0 && (
								<div className='col-span-full'>
									<FormConfig
										formFields={formFields}
										setFormFields={setFormFields}
										variables={variables}
										fetchTaskFormData={fetchTaskFormData}
									/>
								</div>
							)}
						</div>

						{!isStructuredOutput && (
							<div className='p-6 bg-gray-100 rounded-md text-sm col-span-full '>
								<label
									htmlFor='requiresHumanInput'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Assign Task Output to Variable
								</label>

								<div className='col-span-full'>
									{/* Commenting out tooltip for task output variable */}
									{/*<ToolTip
										content='Save task ouput to a variable. This variable will be available in next tasks as well as arguments for tools.'
										placement='top-start'
										arrow={false}>*/}
									<div className='mt-2'>
										<div className='sm:col-span-12'>
											<Select
												value={taskOutputVariable?.name}
												onValueChange={value => {
													if (value == 'new') {
														return setModalOpen('variable');
													}
													setTask(oldTask => {
														return {
															...oldTask,
															taskOutputVariableName: value
														};
													});
												}}>
												<SelectTrigger className='bg-white'>
													<SelectValue placeholder='Select a variable' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='new'>+ Create new variable</SelectItem>
													{variables.map(v => (
														<SelectItem key={v._id.toString()} value={v.name}>
															{v.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
									{/*</ToolTip>*/}
								</div>
							</div>
						)}

						<div className='p-6 bg-gray-100 rounded-md text-sm col-span-full '>
							<div>Output Preferences</div>
							<div className='text-gray-600 mt-2'>
								Streamline user experience and retain important information for future reference.
							</div>
							<ToolTip
								content='Hides intermediate thought messages from agents and only display the final task output.'
								placement='top-start'
								arrow={false}>
								<div className='mt-2'>
									<div className='sm:col-span-12'>
										<label
											htmlFor='displayOnlyFinalOutput'
											className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
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
							<ToolTip
								content='Stores the task output in a file that can be downloaded by the user after the task is completed.'
								placement='top-start'
								arrow={false}>
								<div className='mt-2'>
									<div className='sm:col-span-12'>
										<label
											htmlFor='storeTaskOutput'
											className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
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

							{taskState?.storeTaskOutput && (
								// <ToolTip
								// 	content='Task output file name can only be .txt or .csv'
								// 	placement='top-start'
								// 	arrow={false}>
								<div className='mt-2'>
									<label
										htmlFor='name'
										className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
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
								// </ToolTip>
							)}
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

						{/* displayOnlyFinalOutput tool checkbox */}
					</div>
				</div>

				<div className='mt-6 flex items-center justify-between gap-x-6 dark:text-indigo-200'>
					{!compact && <Link href={`/${resourceSlug}/tasks`}>Back</Link>}
					<button
						type='submit'
						className={`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}>
						Save
					</button>
				</div>
			</form>
		</>
	);
}
