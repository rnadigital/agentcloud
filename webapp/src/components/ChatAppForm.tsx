'use strict';

import * as API from '@api';
import { PlayIcon } from '@heroicons/react/20/solid';
import AgentsSelect from 'components/agents/AgentsSelect';
import AvatarUploader from 'components/AvatarUploader';
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import CreateModelModal from 'components/CreateModelModal';
import CreateToolModal from 'components/modal/CreateToolModal';
import ModelSelect from 'components/models/ModelSelect';
import ParameterForm from 'components/ParameterForm';
import SharingModeSelect from 'components/SharingModeSelect';
import ToolsSelect from 'components/tools/ToolsSelect';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { App, AppType } from 'struct/app';
import { ChatAppAllowedModels, ModelType } from 'struct/model';
import { SharingMode } from 'struct/sharing';
import { ToolType } from 'struct/tool';

export default function ChatAppForm({
	app,
	toolChoices = [],
	modelChoices = [],
	agentChoices = [],
	callback,
	fetchFormData,
	editing
}: {
	app?: App;
	toolChoices?: any[];
	modelChoices?: any[];
	agentChoices?: any;
	callback?: Function;
	fetchFormData?: Function;
	editing?: boolean;
}) {
	//TODO: fix any types

	const { step, setStep }: any = useStepContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [icon, setIcon]: any = useState(app?.icon);
	const [error, setError] = useState();
	const [run, setRun] = useState(false);
	const [modalOpen, setModalOpen]: any = useState(false);
	const [showAgentForm, setShowAgentForm]: any = useState(editing || agentChoices?.length === 0);
	const [sharingMode, setSharingMode] = useState(app?.sharingConfig?.mode || SharingMode.TEAM);
	const [shareLinkShareId, setShareLinkShareId] = useState(app?.shareLinkShareId);
	const origin = typeof location !== 'undefined' ? location.origin : '';
	const posthog = usePostHog();
	const initialAgent = agentChoices.find(a => a?._id === app?.chatAppConfig?.agentId);
	const [appName, setAppName] = useState(app?.name || '');
	const [description, setDescription] = useState(app?.description || '');
	const [conversationStarters, setConversationStarters] = useState(
		app?.chatAppConfig?.conversationStarters
			? app?.chatAppConfig?.conversationStarters.map(x => ({ name: x }))
			: [{ name: '' }]
	);
	const [agentName, setAgentName] = useState(initialAgent?.name || '');
	const [role, setRole] = useState(initialAgent?.role || '');
	const [goal, setGoal] = useState(initialAgent?.goal || '');
	const [backstory, setBackstory] = useState(initialAgent?.backstory || '');
	const [modelId, setModelId] = useState(initialAgent?.modelId || null);

	const getInitialTools = (acc, tid) => {
		const foundTool = toolChoices.find(t => t._id === tid);
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
	const { initialTools, initialDatasources } = (initialAgent?.toolIds || []).reduce(
		getInitialTools,
		{ initialTools: [], initialDatasources: [] }
	);
	const [agentsState, setAgentsState] = useState(
		initialAgent ? { label: initialAgent.name, value: initialAgent._id } : null
	);
	const [toolState, setToolState] = useState(initialTools.length > 0 ? initialTools : null);
	const [datasourceState, setDatasourceState] = useState(
		initialDatasources.length > 0 ? initialDatasources : null
	); //Note: still technically tools, just only RAG tools

	useEffect(() => {
		const agentId = agentsState?.value;
		// !editing && setShowAgentForm(agentId !== app?.chatAppConfig?.agentId);
		const selectedAgent = agentChoices.find(a => a?._id === agentId);
		setAgentName(selectedAgent?.name || '');
		setRole(selectedAgent?.role || '');
		setGoal(selectedAgent?.goal || '');
		setBackstory(selectedAgent?.backstory || '');
		setModelId(selectedAgent?.modelId || '');
		const { initialTools: agentTools, initialDatasources: agentDatasources } = (
			selectedAgent?.toolIds || []
		).reduce(getInitialTools, { initialTools: [], initialDatasources: [] });
		setToolState(agentTools.length > 0 ? agentTools : null);
		setDatasourceState(agentDatasources.length > 0 ? agentDatasources : null);
	}, [agentsState?.value]);

	async function appPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			//app section
			name: appName,
			description,
			conversationStarters: conversationStarters.map(x => x?.name.trim()).filter(x => x),
			sharingMode,
			shareLinkShareId,
			run,
			//existing agent
			agentId: agentsState ? agentsState.value : null,
			//new agent
			agentName,
			role,
			goal,
			backstory,
			modelId,
			toolIds: (toolState || [])
				.map(x => x.value)
				.concat((datasourceState || []).map(x => x.value)),
			type: AppType.CHAT,
			iconId: icon?.id
		};
		// console.log(JSON.stringify(body, null, '\t'));
		if (editing === true) {
			posthog.capture('updateApp', {
				appId: app._id,
				appType: AppType.CHAT,
				appName,
				run
			});
			await API.editApp(
				app._id,
				body,
				() => {
					toast.success('App Updated');
					if (run === true) {
						posthog.capture('startSession', {
							appId: app._id,
							appType: AppType.CHAT,
							appName
						});
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
			API.addApp(
				body,
				res => {
					posthog.capture('createApp', {
						appId: res._id,
						appType: AppType.CHAT,
						appName,
						run
					});
					if (run === true) {
						posthog.capture('startSession', {
							appId: res._id,
							appType: AppType.CHAT,
							appName
						});
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
				router
			);
		}
	}

	const iconCallback = async addedIcon => {
		(await fetchFormData) && fetchFormData();
		setModalOpen(false);
		setIcon({ id: addedIcon?._id, ...addedIcon });
	};

	async function createDatasourceCallback(createdDatasource) {
		console.log('createDatasourceCallback', createdDatasource);
		(await fetchFormData) && fetchFormData();
		setDatasourceState(oldDatasources => {
			const newOption = { label: createdDatasource.name, value: createdDatasource.datasourceId };
			return Array.isArray(oldDatasources) ? oldDatasources.concat(newOption) : [newOption];
		});
		setModalOpen(false);
	}

	async function modelCallback(addedModelId) {
		console.log('addedModelId', addedModelId);
		(await fetchFormData) && fetchFormData();
		setModelId(addedModelId);
		setModalOpen(false);
	}

	async function toolCallback(addedToolId, addedTool) {
		console.log('addedToolId', addedToolId);
		(await fetchFormData) && fetchFormData();
		if ((addedTool?.type as ToolType) == ToolType.RAG_TOOL) {
			setDatasourceState(oldDatasourcesState =>
				(oldDatasourcesState || []).concat([{ label: addedTool.name, value: addedToolId }])
			);
		} else {
			setToolState(oldToolState =>
				(oldToolState || []).concat([{ label: addedTool.name, value: addedToolId }])
			);
		}
		setModalOpen(false);
	}

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
		case 'model':
			modal = (
				<CreateModelModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={modelCallback}
					modelFilter='llm'
					modelTypeFilters={[...ChatAppAllowedModels]}
				/>
			);
			break;
		case 'tool':
			modal = (
				<CreateToolModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={toolCallback}
					initialType={ToolType.FUNCTION_TOOL}
				/>
			);
			break;
		default:
			modal = null;
			break;
	}

	return (
		<>
			{modal}
			<h2 className='text-xl font-bold mb-6 dark:text-white'>Chat App</h2>
			<form onSubmit={appPost}>
				<input type='hidden' name='_csrf' value={csrf} />

				<div className='space-y-4'>
					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-4'>
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

					<div className='grid grid-cols-1 gap-x-8 gap-y-10 pb-6 border-b border-gray-900/10 pb-12'>
						<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-6'>
							<div className='sm:col-span-12'>
								<label
									htmlFor='appName'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
								>
									App Name
								</label>
								<input
									required
									type='text'
									name='appName'
									id='appName'
									value={appName}
									onChange={e => {
										setAppName(e.target.value);
									}}
									className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								/>
							</div>
							<div className='sm:col-span-12 flex flex-row gap-4'>
								<div className='w-full'>
									<label
										htmlFor='description'
										className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
									>
										App Description
									</label>
									<textarea
										required
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
								<label className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Conversation Starters
								</label>
								<ParameterForm
									readonly={false}
									parameters={conversationStarters}
									setParameters={setConversationStarters}
									title={null}
									disableTypes={true}
									disableDescription={true}
									hideRequired={true}
									namePlaceholder=''
									descriptionPlaceholder='Value'
									addButtonText={'+'}
								/>
							</div>

							{agentChoices?.length > 0 && (
								<AgentsSelect
									agentChoices={agentChoices}
									agentsState={agentsState}
									onChange={agentsState => {
										setShowAgentForm(true);
										setAgentsState(agentsState);
									}}
									setModalOpen={() => {
										setShowAgentForm(true);
										setAgentsState(null);
									}}
									multiple={false}
								/>
							)}

							{showAgentForm && (
								<>
									<hr className='col-span-12' />

									<div className='sm:col-span-12'>
										<label
											htmlFor='agentName'
											className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
										>
											Agent Name
										</label>
										<input
											required
											type='text'
											name='agentName'
											id='agentName'
											className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
											value={agentName}
											onChange={e => {
												setAgentName(e.target.value);
											}}
										/>
									</div>

									<div className='sm:col-span-12 flex flex-row gap-4'>
										<div className='isolate space-y-px rounded-md shadow-sm w-full'>
											<label
												htmlFor='systemMessage'
												className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mb-2'
											>
												System Message
											</label>
											<div className='bg-white dark:bg-slate-800 relative rounded-md rounded-b-none px-0 ring-1 ring-outset ring-gray-300 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-600'>
												<label
													htmlFor='role'
													className='p-2 pb-0 block text-xs font-medium text-gray-900 dark:text-slate-400'
												>
													Role
												</label>
												<textarea
													required
													id='role'
													name='role'
													placeholder="Defines the agent's function within the crew. It determines the kind of tasks the agent is best suited for."
													className='relative block w-full border-0 p-2 pt-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
													rows={3}
													value={role}
													onChange={e => {
														setRole(e.target.value);
													}}
												/>
											</div>
											<div className='bg-white dark:bg-slate-800  relative rounded-none px-0 ring-1 ring-outset ring-gray-300 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-600'>
												<label
													htmlFor='goal'
													className='p-2 pb-0 block text-xs font-medium text-gray-900 dark:text-slate-400'
												>
													Goal
												</label>
												<textarea
													required
													id='goal'
													name='goal'
													placeholder="The individual objective that the agent aims to achieve. It guides the agent's decision-making process."
													className='block w-full border-0 p-2 pt-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
													rows={2}
													value={goal}
													onChange={e => {
														setGoal(e.target.value);
													}}
												/>
											</div>
											<div className='bg-white dark:bg-slate-800  overflow-hidden rounded-md rounded-t-none px-0 ring-1 ring-outset ring-gray-300 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-600'>
												<label
													htmlFor='backstory'
													className='p-2 pb-0 block text-xs font-medium text-gray-900 dark:text-slate-400'
												>
													Backstory
												</label>
												<textarea
													required
													id='backstory'
													name='backstory'
													placeholder="Provides context to the agent's role and goal, enriching the interaction and collaboration dynamics."
													className='block w-full border-0 p-2 pt-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
													rows={2}
													value={backstory}
													onChange={e => {
														setBackstory(e.target.value);
													}}
												/>
											</div>
										</div>
									</div>

									<ModelSelect
										models={modelChoices}
										modelId={modelId}
										label='Model'
										onChange={model => setModelId(model?.value)}
										setModalOpen={setModalOpen}
										callbackKey='modelId'
										setCallbackKey={null}
										modelFilter='llm'
										modelTypeFilters={[...ChatAppAllowedModels]}
									/>

									<ToolsSelect
										tools={toolChoices.filter(t => (t?.type as ToolType) !== ToolType.RAG_TOOL)}
										toolState={toolState}
										onChange={setToolState}
										setModalOpen={setModalOpen}
										enableAddNew={true}
									/>

									<ToolsSelect
										title='Datasources'
										addNewTitle='+ New Datasource'
										tools={toolChoices.filter(t => (t?.type as ToolType) === ToolType.RAG_TOOL)}
										toolState={datasourceState}
										onChange={setDatasourceState}
										setModalOpen={x => setModalOpen('datasource')}
										enableAddNew={true}
									/>
								</>
							)}
						</div>
					</div>
				</div>

				<div className='mt-6 flex items-center justify-between gap-x-6'>
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
							onClick={() => setRun(true)}
							className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center'
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
