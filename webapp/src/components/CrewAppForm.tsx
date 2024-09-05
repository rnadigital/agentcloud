'use strict';

import * as API from '@api';
import { InformationCircleIcon, PlayIcon } from '@heroicons/react/20/solid';
import AgentsSelect from 'components/agents/AgentsSelect';
import AvatarUploader from 'components/AvatarUploader';
import CreateAgentModal from 'components/CreateAgentModal';
import CreateModelModal from 'components/CreateModelModal';
import CreateTaskModal from 'components/CreateTaskModal';
import InfoAlert from 'components/InfoAlert';
import SharingModeSelect from 'components/SharingModeSelect';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import { Model } from 'db/model';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { Agent } from 'struct/agent';
import { AppType } from 'struct/app';
import { ProcessImpl } from 'struct/crew';
import { ModelType } from 'struct/model';
import { SharingMode } from 'struct/sharing';
import { Task } from 'struct/task';
import { Variable } from 'struct/variable';

import ToolTip from './shared/ToolTip';

export default function CrewAppForm({
	agentChoices = [],
	taskChoices = [],
	modelChoices = [],
	crew = {},
	app = {},
	variableChoices = [],
	editing,
	compact = false,
	callback,
	fetchFormData
}: {
	agentChoices?: Agent[];
	taskChoices?: Task[];
	variableChoices?: Variable[];
	crew?: any;
	modelChoices: Model[];
	app?: any;
	editing?: boolean;
	compact?: boolean;
	callback?: Function;
	fetchFormData?: Function;
}) {
	//TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const { step, setStep }: any = useStepContext();
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen]: any = useState(false);
	const [crewState, setCrew] = useState(crew);
	const [appState, setApp] = useState(app);
	const initialModel = modelChoices.find(model => model._id == crew.managerModelId);
	const [managerModel, setManagerModel]: any = useState(
		initialModel ? { label: initialModel.name, value: initialModel._id } : null
	);
	const [sharingMode, setSharingMode] = useState(appState?.sharingConfig?.mode || SharingMode.TEAM);
	const [shareLinkShareId, setShareLinkShareId] = useState(app?.shareLinkShareId);
	const [appMemory, setAppMemory] = useState(app.memory === true);
	const [appCache, setAppCache] = useState(app.cache === true);
	const [fullOutput, setFullOutput] = useState(crew.fullOutput === true);
	const [description, setDescription] = useState(app.description || '');
	const [error, setError] = useState();
	const { name, agents, tasks, verbose } = crewState || {};
	const [verboseInt, setVerboseInt] = useState(verbose);
	const { tags } = appState; //TODO: make it take correct stuff from appstate
	const [run, setRun] = useState(false);
	// const requiredVariables= variableChoices?.filter(v => v.required === true);
	console.log(agentChoices, taskChoices);

	function getInitialData(initData) {
		const { agents, tasks } = initData;
		const initialAgents: { label: string; value: string; allowDelegation?: boolean }[] =
			agents &&
			agents
				.map(a => {
					const oa = agentChoices.find(ai => ai._id === a);
					return oa ? { label: oa.name, value: a, allowDelegation: oa.allowDelegation } : null;
				})
				.filter(n => n);
		const initialTasks =
			tasks &&
			tasks
				.map(t => {
					const ot = taskChoices.find(at => at._id === t);
					return ot ? { label: ot.name, value: t } : null;
				})
				.filter(n => n);
		return { initialAgents, initialTasks };
	}

	const { initialAgents, initialTasks } = getInitialData({ agents, tasks });
	const [agentsState, setAgentsState] = useState(initialAgents || []);
	const [icon, setIcon] = useState(app?.icon);
	const [tasksState, setTasksState] = useState<{ label: string; value: string }[]>(
		initialTasks || []
	);
	const agentVariables = agentChoices
		.filter(a => agentsState.some(v => v.value === a._id.toString()))
		.flatMap(a => a.variableIds)
		.filter(Boolean);

	const taskVariables = taskChoices
		.filter(t => tasksState.some(v => v.value === t._id.toString()))
		.flatMap(t => t.variableIds)
		.filter(Boolean);

	const combinedVariables = Array.from(new Set([...agentVariables, ...taskVariables])).sort();

	const selectedVariables = variableChoices.filter(v =>
		combinedVariables.includes(v._id.toString())
	);
	const [variableValues, setVariableValues] = useState<{ [key: string]: string }>({});

	const handleVariableChange = (id: string, value: string) => {
		setVariableValues(prev => ({ ...prev, [id]: value }));
	};

	const missingAgents: Agent[] = tasksState?.reduce((acc, t) => {
		const task = taskChoices.find(tc => tc._id === t.value);
		if (task && !agentsState.some(a => a.value === task.agentId)) {
			const missingAgent = agentChoices.find(ac => ac._id === task.agentId);
			if (missingAgent && !acc.some(a => a._id === missingAgent._id)) acc.push(missingAgent);
		}
		return acc;
	}, []);

	useEffect(() => {
		if (!app?.crew || !app) {
			return;
		}
		setApp(app);
		setCrew(app.crew);
		setIcon(app?.icon);
		setFullOutput(app.crew?.fullOutput);
		const { agents, tasks, name, verbose } = app.crew;
		setVerboseInt(verbose);
		setDescription(app?.description);
		setAppCache(app?.cache);
		const { initialAgents, initialTasks } = getInitialData({ tasks, agents });
		setAgentsState(initialAgents || []);
		setTasksState(initialTasks);
	}, [app?._id]);

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
			memory: appMemory,
			cache: appCache,
			managerModelId: managerModel?.value,
			tasks: tasksState.map(x => x.value),
			iconId: icon?.id,
			type: AppType.CREW,
			run,
			sharingMode,
			shareLinkShareId,
			verbose: Number(e.target.verbose.value) || 0,
			fullOutput
		};
		if (editing === true) {
			await API.editApp(
				appState._id,
				body,
				() => {
					toast.success('App Updated');
					if (run === true) {
						API.addSession(
							{
								_csrf: e.target._csrf.value,
								resourceSlug,
								id: app._id
							},
							null,
							toast.error,
							router
						);
					}
				},
				toast.error,
				null
			);
		} else {
			const addedApp: any = await API.addApp(
				body,
				res => {
					if (run === true) {
						API.addSession(
							{
								_csrf: e.target._csrf.value,
								resourceSlug,
								id: res._id
							},
							null,
							toast.error,
							router
						);
					}
				},
				toast.error,
				compact ? null : router
			);
			callback && addedApp && callback(addedApp._id);
		}
	}

	async function createAgentCallback(addedAgentId, body) {
		console.log('createAgentCallback addedAgentId', addedAgentId);
		(await fetchFormData) && fetchFormData();
		setAgentsState(oldAgentsState => {
			return oldAgentsState.concat({ label: body.name, value: addedAgentId });
		});
		setModalOpen(false);
	}

	// async function createToolCallback() { // TODO:
	// 	await fetchFormData && fetchFormData();
	// 	setModalOpen(false);
	// }

	async function createTaskCallback(addedTaskId, body) {
		(await fetchFormData) && fetchFormData();
		setTasksState(oldTasksState => {
			return oldTasksState.concat({ label: body.name, value: addedTaskId });
		});
		setModalOpen(false);
	}

	const iconCallback = async addedIcon => {
		(await fetchFormData) && fetchFormData();
		setModalOpen(false);
		setIcon({ id: addedIcon?._id, ...addedIcon });
	};

	const modelCallback = async (addedModelId, body) => {
		(await fetchFormData) && fetchFormData();
		setModalOpen(false);
		setManagerModel({ value: addedModelId, name: body?.name });
	};

	let modal;
	switch (modalOpen) {
		case 'agent':
			modal = (
				<CreateAgentModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={createAgentCallback}
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
		case 'model':
			modal = (
				<CreateModelModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={modelCallback}
					modelFilter='llm'
					modelTypeFilters={[
						ModelType.GROQ,
						ModelType.OPENAI,
						ModelType.AZURE_OPENAI,
						ModelType.OLLAMA,
						// ModelType.COHERE,
						ModelType.ANTHROPIC,
						ModelType.GOOGLE_VERTEX,
						ModelType.GOOGLE_AI
					]}
				/>
			);
			break;
		case 'tool':
			modal = (
				<InfoAlert
					textColor='black'
					className='rounded bg-orange-200 p-4'
					message='Not implemented'
				/>
			);
			// 	modal = <CreateToolModal open={modalOpen !== false} setOpen={setModalOpen} callback={createToolCallback} />;
			break;
		default:
			modal = null;
			break;
	}

	return (
		<>
			{modal}
			{!editing && <h2 className='text-xl font-bold mb-6 dark:text-white'>Process App</h2>}
			<form onSubmit={appPost}>
				<input type='hidden' name='_csrf' value={csrf} />

				<div className='space-y-4'>
					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 md:col-span-2'>
						<div className='sm:col-span-12'>
							<label
								htmlFor='name'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Avatar
							</label>
							<div className='mt-2'>
								<AvatarUploader existingAvatar={icon} callback={iconCallback} />
							</div>
						</div>
					</div>

					<div
						className={`grid grid-cols-1 gap-x-8 gap-y-4 pb-6 border-b border-gray-900/10 pb-${compact ? '6' : '12'}`}
					>
						<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
							<div className='sm:col-span-12'>
								<label
									htmlFor='name'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
								>
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
									<label
										htmlFor='description'
										className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
									>
										Description
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

							<SharingModeSelect
								sharingMode={sharingMode}
								setSharingMode={setSharingMode}
								showInfoAlert={true}
								setShareLinkShareId={setShareLinkShareId}
								shareLinkShareId={shareLinkShareId}
							/>

							<div className='sm:col-span-12'>
								<label
									htmlFor='members'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
								>
									Tasks
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
										value={tasksState?.length > 0 ? tasksState : null}
										onChange={(v: any) => {
											if (v && v.length > 0 && v[v.length - 1]?.value == null) {
												return setModalOpen('task');
											}
											setTasksState(v || []);
										}}
										options={[{ label: '+ New task', value: null }].concat(
											taskChoices.map(a => ({ label: a.name, value: a._id }))
										)}
										formatOptionLabel={(data: any) => {
											const optionTask = taskChoices.find(tc => tc._id === data.value);
											return (
												<li
													className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
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

							<AgentsSelect
								agentChoices={agentChoices}
								agentsState={agentsState}
								onChange={agentsState => setAgentsState(agentsState)}
								setModalOpen={setModalOpen}
								multiple={true}
							/>
							{missingAgents?.length > 0 && (
								<div className='sm:col-span-12 text-xs -mt-4'>
									<div className='flex flex-wrap gap-2 items-center'>
										<label className='block leading-6 text-gray-900 dark:text-slate-400'>
											Required Agents
										</label>
										{missingAgents.map(agent => (
											<div
												key={agent._id as string}
												className='flex items-center px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-full cursor-pointer'
												onClick={() =>
													setAgentsState([
														...agentsState,
														{
															label: agent.name,
															value: agent._id as string,
															allowDelegation: agent.allowDelegation
														}
													])
												}
											>
												<span className='text-gray-900 dark:text-slate-200'>{agent.name}</span>
											</div>
										))}
									</div>
								</div>
							)}

							{selectedVariables.length > 0 && (
								<div className='sm:col-span-12'>
									<div className='flex flex-col gap-2'>
										<label
											htmlFor='variables'
											className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
										>
											Variables
										</label>
										<div className='mt-2 space-y-2'>
											{selectedVariables.map(variable => (
												<div key={variable._id.toString()} className='flex gap-2 items-center'>
													<label
														htmlFor={`variable-${variable._id}`}
														className='text-sm text-gray-900 dark:text-slate-400'
													>
														{variable.name}
													</label>
													<input
														type='text'
														id={`variable-${variable._id}`}
														value={variableValues[variable._id.toString()] || ''}
														onChange={e =>
															handleVariableChange(variable._id.toString(), e.target.value)
														}
														className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
													/>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							<div className='sm:col-span-2'>
								<div className='flex gap-2 text-gray-900 dark:text-slate-400 items-center'>
									<label htmlFor='verbose' className='block text-sm font-medium leading-6'>
										Verbose
									</label>
									<ToolTip content='Verbosity level controls whether agent thoughts and actions appear for agents during the session of a process app. Setting it to zero will ensure a clean run, only showing agents final answers in the app.'>
										<div className='cursor-pointer'>
											<InformationCircleIcon className='h-4 w-4' />
										</div>
									</ToolTip>
								</div>
								<input
									type='number'
									name='verbose'
									id='verbose'
									defaultValue={verboseInt}
									className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								/>
							</div>

							{/*<div className='sm:col-span-12'>
							<label className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Process
							</label>
							<div className='mt-2'>
								<label className='inline-flex items-center mr-6 text-sm'>
									<input
										type='radio'
										name='process'
										value={ProcessImpl.SEQUENTIAL}
										defaultChecked={crewState.process === ProcessImpl.SEQUENTIAL}
										onChange={(e) => { e.target.checked && setCrew(previousCrew => { return { ...previousCrew, process: ProcessImpl.SEQUENTIAL }; }); }}
										className='form-radio'
									/>
									<span className='ml-2'>Sequential</span>
								</label>
								<label className='inline-flex items-center text-sm'>
									<input
										type='radio'
										name='process'
										value={ProcessImpl.HIERARCHICAL}
										defaultChecked={crewState.process === ProcessImpl.HIERARCHICAL}
										onChange={(e) => { e.target.checked && setCrew(previousCrew => { return { ...previousCrew, process: ProcessImpl.HIERARCHICAL }; }); }}
										className='form-radio'
									/>
									<span className='ml-2'>Flexible</span>
								</label>
							</div>
						</div>*/}

							{/*<ModelSelect
								models={modelChoices}
								modelId={managerModel?.value}
								label='Chat Manager Model'
								onChange={model => setManagerModel(model)}
								setModalOpen={setModalOpen}
								callbackKey=''
								setCallbackKey={() => {}}
								modelFilter='llm'
							/>*/}

							<div className='sm:col-span-12'>
								<div className='mt-2'>
									<label
										htmlFor='fullOutput'
										className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
									>
										<input
											id='fullOutput'
											type='checkbox'
											name='fullOutput'
											checked={fullOutput}
											onChange={e => setFullOutput(e.target.checked)}
											className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
										/>
										<span className='ml-2 flex'>Full final output</span>
										<p className='text-sm'></p>
									</label>
								</div>
							</div>

							<div className='sm:col-span-12'>
								<div className='mt-2'>
									<label
										htmlFor='appCache'
										className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
									>
										<input
											id='appCache'
											type='checkbox'
											name='cache'
											checked={appCache}
											onChange={e => setAppCache(e.target.checked)}
											className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
										/>
										<span className='ml-2'>Cache Tool Results</span>
									</label>
								</div>
							</div>

							<div className='sm:col-span-12'>
								<div className='mt-2'>
									<label
										htmlFor='appMemory'
										className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
									>
										<input
											id='appMemory'
											type='checkbox'
											name='memory'
											checked={appMemory}
											onChange={e => setAppMemory(e.target.checked)}
											className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
										/>
										<span className='ml-2'>Enable Memory (Experimental)</span>
										<p className='text-sm'></p>
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='mt-6 flex items-center justify-between gap-x-6'>
					{!compact && (
						<button
							className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center'
							onClick={e => {
								e.preventDefault();
								step > 0 ? setStep(0) : router.push(`/${resourceSlug}/apps`);
							}}
						>
							<svg
								className='h-4 w-4 mr-2'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									d='M15 19l-7-7 7-7'
								></path>
							</svg>
							<span>Back</span>
						</button>
					)}
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
							disabled={missingAgents?.length > 0}
							onClick={() => setRun(true)}
							className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center disabled:bg-indigo-200 disabled:text-gray-500'
						>
							<PlayIcon className='h-4 w-4 mr-2' />
							Save and Run
						</button>
					</div>
				</div>
			</form>
		</>
	);
}
