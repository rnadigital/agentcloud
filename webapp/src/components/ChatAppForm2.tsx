import * as API from '@api';

import { AgentCreatedDisplay } from 'components/apps/AgentCreatedDisplay';
import { AgentSelectDisplay } from 'components/apps/AgentSelectDisplay';
import { CreateAgentSheet } from 'components/apps/CreateAgentSheet';
import { InsightChat } from 'components/apps/InsightChat';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import { useThemeContext } from 'context/themecontext';
import { AgentsDataReturnType } from 'controllers/agent';
import { AppsDataReturnType } from 'controllers/app';
import { Model } from 'db/model';
import useAutocompleteDropdown from 'hooks/useAutoCompleteDropdown';
import { ChevronDown, Circle, Layout, Pencil, SendHorizonal, Trash2 } from 'lucide-react';
import { MultiSelect } from 'modules/components/multi-select';
import { Button } from 'modules/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import { useRouter } from 'next/router';
// import agents from 'pages/[resourceSlug]/agents';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAgentStore } from 'store/agent';
import { Agent } from 'struct/agent';
import { App, AppType } from 'struct/app';
import { ChatAppAllowedModels } from 'struct/model';
import { SharingMode } from 'struct/sharing';
import { ToolType } from 'struct/tool';

import AddEmailModal from './AddEmailModal';
import ConfirmModal from './ConfirmModal';
import CreateDatasourceModal from './CreateDatasourceModal';
import CreateModelModal from './CreateModelModal';
import CreateToolModal from './modal/CreateToolModal';
import SharingModeSelect from './SharingModeSelect';
import CreateVariableModal from './variables/CreateVariableModal';
import { Database } from 'lucide-react';

const chatAppTaglines = [
	'Build single agent chat bots (like GPTS)',
	'Integrate RAG datasources',
	'Add custom agent',
	'Integrate custom tools',
	'Embed your chat app via IFrame'
];

const processAppTaglines = [
	'Build Multi-Agent Process Apps (powered by Crew AI)',
	'Integrate RAG datasources',
	'Add custom code tools',
	'Add tasks',
	'Embed your process app via IFrame'
];

export default function Apps({
	app,
	toolChoices = [],
	modelChoices = [],
	agentChoices = [],
	whiteListSharingChoices = [],
	callback,
	fetchFormData,
	editing,
	variableChoices = []
}: {
	app?: App;
	toolChoices?: any[];
	modelChoices?: Model[];
	whiteListSharingChoices?: any[];
	agentChoices?: Agent[];
	callback?: Function;
	fetchFormData?: Function;
	editing?: boolean;
	variableChoices?: AgentsDataReturnType['variables'];
}) {
	const [hasLaunched, setHasLaunched] = useState<boolean>(false);
	const [selectedAgent, setSelectedAgent] = useState<Agent>();
	const [openEditSheet, setOpenEditSheet] = useState<boolean>(false);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [editingStarterId, setEditingStarterId] = useState<number | null>(null);
	const [pendingAgentId, setPendingAgentId] = useState<string>();
	const [run, setRun] = useState(false);
	const [outsideOrg, setOutsideOrg] = useState(false);
	const [modalOpen, setModalOpen]: any = useState(false);

	const [isAgentUpdating, setIsAgentUpdating] = useState(false);

	// Add state for editing agent tools and connections
	const [agentToolState, setAgentToolState] = useState<any[]>([]);
	const [agentDatasourceState, setAgentDatasourceState] = useState<any[]>([]);

	const selectedAgentModel = modelChoices.find(model => model._id === selectedAgent?.modelId);
	const selectedAgentTools = toolChoices.filter(tool => selectedAgent?.toolIds?.includes(tool._id));

	// Debug logging
	console.log('selectedAgent:', selectedAgent);
	console.log('selectedAgentTools:', selectedAgentTools);
	console.log('agentToolState:', agentToolState);
	console.log('agentDatasourceState:', agentDatasourceState);
	console.log('toolChoices:', toolChoices);

	const posthog = usePostHog();

	const handleStarterEdit = (id: number, newText: string) => {
		setConversationStarters(
			conversationStarters.map(starter =>
				starter.id === id ? { ...starter, text: newText } : starter
			)
		);
	};

	const handleStarterDelete = (id: number) => {
		setConversationStarters(conversationStarters.filter(starter => starter.id !== id));
	};

	const handleAddStarter = () => {
		const newId = Math.max(0, ...conversationStarters.map(s => s.id)) + 1;
		const newStarter = { id: newId, text: '' };
		setConversationStarters([...conversationStarters, newStarter]);
		setEditingStarterId(newId);
	};

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;

	const [shareEmail, setShareEmail] = useState(false);

	const router = useRouter();
	const { resourceSlug } = router.query;

	const [sharingMode, setSharingMode] = useState(app?.sharingConfig?.mode || SharingMode.TEAM);
	const [shareLinkShareId, setShareLinkShareId] = useState(editing ? app?.shareLinkShareId : null);
	const [appName, setAppName] = useState(app?.name || 'Untitled Chat App');
	const [description, setDescription] = useState(app?.description || '');
	const [maxMessages, setMaxMessages] = useState(app?.chatAppConfig?.maxMessages || 30);

	// Initialize conversation starters from app data or use defaults
	const [conversationStarters, setConversationStarters] = useState(() => {
		if (editing && app?.chatAppConfig?.conversationStarters) {
			const starters = app.chatAppConfig.conversationStarters.map((text, index) => ({
				id: index + 1,
				text
			}));
			return starters;
		}
		const defaults = [
			{ id: 1, text: 'Help me brainstorm some ideas' },
			{ id: 2, text: 'What can you help me with?' }
		];
		return defaults;
	});

	const initialEmails = whiteListSharingChoices
		? whiteListSharingChoices.map(email => ({ label: email, value: email }))
		: null;
	const [sharingEmailState, setSharingEmailState] = useState(
		Object.values(app?.sharingConfig?.permissions || {}).map(x => ({
			label: x as string,
			value: x as string
		}))
	);

	async function emailCallback(newEmail) {
		setSharingEmailState(() => [...sharingEmailState, { label: newEmail, value: newEmail }]);
		setOutsideOrg(true);
		setModalOpen(false);
	}

	async function createDatasourceCallback(createdDatasource) {
		if (fetchFormData) {
			await fetchFormData();
		}
		setAgentDatasourceState(prev => [
			...prev,
			{ label: createdDatasource.name, value: createdDatasource.datasourceId }
		]);
		setModalOpen(false);
	}

	const toolCallback = async (addedToolId, body) => {
		if (fetchFormData) {
			await fetchFormData();
		}
		setModalOpen(false);

		const newTool = {
			label: body.name,
			value: addedToolId.toString()
		};

		setAgentToolState(prevTools => {
			const existingTools = Array.isArray(prevTools) ? prevTools : [];
			return [...existingTools, newTool];
		});
	};

	let modal;
	switch (modalOpen) {
		case 'whitelist':
			modal = (
				<AddEmailModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					confirmFunction={emailCallback}
					cancelFunction={() => {
						setModalOpen(false);
					}}
					title='Share with new email'
					callback={emailCallback}
				/>
			);
			break;
		case 'confirmOutsideOrg':
			modal = (
				<ConfirmModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					confirmFunction={() => {
						setOutsideOrg(false);
						setModalOpen(false);
					}}
					cancelFunction={() => {
						setModalOpen(false);
					}}
					title={'Sharing Outside Team'}
					message={
						"You are sharing this app with people outside your team. After confirming pressing 'save' will save the app."
					}
				/>
			);
			break;
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
		case 'tool':
			modal = (
				<CreateToolModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={toolCallback}
				/>
			);
			break;
		default:
			modal = null;
			break;
	}

	async function appPost(e) {
		e.preventDefault();

		// Update agent tools if there are changes
		if (selectedAgent && (agentToolState.length > 0 || agentDatasourceState.length > 0)) {
			try {
				// Combine tools and datasources into toolIds
				const allToolIds = [
					...(agentToolState || []).map(tool => tool.value),
					...(agentDatasourceState || []).map(datasource => datasource.value)
				];

				const agentBody = {
					_csrf: csrf,
					resourceSlug,
					name: selectedAgent.name,
					modelId: selectedAgent.modelId,
					functionModelId: selectedAgent.functionModelId,
					allowDelegation: selectedAgent.allowDelegation,
					verbose: selectedAgent.verbose,
					role: selectedAgent.role,
					goal: selectedAgent.goal,
					backstory: selectedAgent.backstory,
					toolIds: allToolIds,
					iconId: selectedAgent.icon?.id,
					variableIds: selectedAgent.variableIds || []
				};

				await API.editAgent(
					selectedAgent._id,
					agentBody,
					() => {
						// Agent updated successfully, continue with app save
					},
					error => {
						toast.error(error || 'Error updating agent tools');
						return; // Don't continue with app save if agent update fails
					},
					null
				);
			} catch (error) {
				console.error('Error updating agent tools:', error);
				toast.error('Error updating agent tools');
				return; // Don't continue with app save if agent update fails
			}
		}

		const body = {
			_csrf: csrf,
			resourceSlug,
			//app section
			name: appName,
			description,
			conversationStarters: conversationStarters.map(x => x.text),
			sharingEmails: sharingEmailState.map(x => x?.label.trim()).filter(x => x),
			sharingMode,
			shareLinkShareId,
			run,
			maxMessages,
			agentId: selectedAgent?._id,
			type: AppType.CHAT,
			cloning: app && !editing
		};

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
								_csrf: csrf,
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
								_csrf: csrf,
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

	useEffect(() => {
		if (sharingMode !== SharingMode.WHITELIST) {
			setSharingEmailState([]);
		}
	}, [sharingMode]);

	useEffect(() => {
		if (pendingAgentId && agentChoices) {
			// When setting a new agent, always get the fresh version from choices
			const newAgent = agentChoices.find(a => a._id === pendingAgentId);
			if (newAgent) {
				setSelectedAgent(newAgent);
			}
			setPendingAgentId(null);
		}
	}, [pendingAgentId, agentChoices]);

	// Initialize selectedAgent from app data when editing
	useEffect(() => {
		if (
			editing &&
			app?.chatAppConfig?.agentId &&
			agentChoices &&
			!selectedAgent &&
			!pendingAgentId
		) {
			const existingAgent = agentChoices.find(a => a._id === app.chatAppConfig.agentId);
			if (existingAgent) {
				setSelectedAgent(existingAgent);
			}
		}
	}, [editing, app?.chatAppConfig?.agentId, agentChoices, selectedAgent, pendingAgentId]);

	// Additional effect to handle agentChoices loading after component mount
	useEffect(() => {
		if (
			editing &&
			app?.chatAppConfig?.agentId &&
			agentChoices?.length > 0 &&
			!selectedAgent &&
			!pendingAgentId
		) {
			const existingAgent = agentChoices.find(a => a._id === app.chatAppConfig.agentId);
			if (existingAgent) {
				setSelectedAgent(existingAgent);
			}
		}
	}, [agentChoices, editing, app?.chatAppConfig?.agentId, selectedAgent, pendingAgentId]);

	const handleAgentUpdate = async (updatedAgent: Agent) => {
		try {
			setIsAgentUpdating(true);

			// First fetch fresh data
			await fetchFormData();

			// Then find the latest version of the agent from updated choices
			const freshAgent = agentChoices.find(a => a._id === updatedAgent._id);
			if (freshAgent) {
				setSelectedAgent(freshAgent);
			} else {
				setSelectedAgent(updatedAgent); // Fallback to passed agent if not found
			}
		} catch (error) {
			console.error('Error updating agent:', error);
			toast.error('Failed to refresh agent data');
		} finally {
			setIsAgentUpdating(false);
		}
	};

	// Add this effect to keep selectedAgent in sync with agentChoices
	useEffect(() => {
		if (selectedAgent && agentChoices) {
			const freshAgent = agentChoices.find(a => a._id === selectedAgent._id);
			if (freshAgent && JSON.stringify(freshAgent) !== JSON.stringify(selectedAgent)) {
				setSelectedAgent(freshAgent);
			}
		}
	}, [agentChoices]);

	// Initialize agent tool states when selected agent changes
	useEffect(() => {
		if (selectedAgent && selectedAgentTools) {
			const tools = selectedAgentTools
				.filter(tool => tool.type !== ToolType.RAG_TOOL)
				.map(tool => ({
					label: tool.name,
					value: tool._id.toString()
				}));
			setAgentToolState(tools);

			const datasources = selectedAgentTools
				.filter(tool => tool.type === ToolType.RAG_TOOL)
				.map(tool => ({
					label: tool.name,
					value: tool._id.toString()
				}));
			setAgentDatasourceState(datasources);
		} else {
			// Reset states when no agent is selected
			setAgentToolState([]);
			setAgentDatasourceState([]);
		}
	}, [selectedAgent, selectedAgentTools]);

	const refreshAgentData = async () => {
		if (isAgentUpdating) return;

		try {
			await fetchFormData();
			if (selectedAgent?._id) {
				const refreshedAgent = agentChoices.find(a => a._id === selectedAgent._id);
				if (refreshedAgent) {
					setSelectedAgent(refreshedAgent);
				}
			}
		} catch (error) {
			console.error('Error refreshing agent data:', error);
		}
	};

	return (
		<main className='text-foreground flex flex-col gap-2'>
			<div className='flex gap-2 mb-2 text-sm'>
				<h4 className='text-gray-700 font-semibold'>Apps</h4>
				<span className='text-gray-500'>&gt;</span>
				<h4 className='text-gray-700 font-semibold'>Create App</h4>
				<span className='text-gray-500'>&gt;</span>
				<h4 className='text-gray-500 font-semibold'>Chat App</h4>
			</div>

			{hasLaunched ? (
				<InsightChat hasLaunched={hasLaunched} setHasLaunched={setHasLaunched} />
			) : (
				<div className='flex border border-gray-200 rounded-lg'>
					<form
						className='flex flex-col justify-between border border-gray-200 rounded-l-lg w-full minh-[790px]'
						onSubmit={appPost}>
						<article className='flex flex-col p-5 gap-6'>
							<div className='flex items-center gap-3 h-24'>
								<img className='rounded-3xl' src='/apps/identicon.png' />
								<div className='w-full h-full flex flex-col justify-around'>
									<div className='w-full flex justify-between'>
										<div className='flex items-center gap-2'>
											{isEditing ? (
												<input
													type='text'
													value={appName}
													onChange={e => setAppName(e.target.value)}
													onBlur={() => setIsEditing(false)}
													onKeyDown={e => {
														if (e.key === 'Enter') {
															setIsEditing(false);
														}
													}}
													className='font-semibold text-lg border rounded px-2 focus:outline-none focus:border-[#4F46E5]'
													autoFocus
												/>
											) : (
												<p className='font-semibold text-lg'>{appName}</p>
											)}
											<button
												type='button'
												onClick={() => {
													setIsEditing(!isEditing);
													if (appName === 'Untitled Chat App') {
														setAppName('');
													}
												}}
												className='hover:text-[#4F46E5] transition-colors'>
												<Pencil width={20} />
											</button>
										</div>
										<div className='hidden md:flex items-center gap-2 bg-gray-100 px-2 py--0.5 rounded-sm'>
											<Circle width={8} />
											<p className='font-medium text-xs'>Draft</p>
										</div>
									</div>
									<input
										value={description}
										onChange={e => setDescription(e.target.value)}
										className='w-full h-full rounded-lg mt-2 text-gray-500 px-4 py-2 bg-gray-50 border border-gray-300'
										placeholder='Describe the essential tasks and goals this chat app aims to
                    achieve.'
									/>
								</div>
							</div>
							{selectedAgent && selectedAgentModel && (
								<AgentCreatedDisplay
									selectedAgent={selectedAgent}
									openEditSheet={openEditSheet}
									setOpenEditSheet={setOpenEditSheet}
									selectedAgentModel={selectedAgentModel}
									selectedAgentTools={selectedAgentTools}
									setSelectedAgent={handleAgentUpdate}
									onAgentUpdate={refreshAgentData}
									isUpdating={isAgentUpdating}
									onChangeAgent={() => setSelectedAgent(null)} // Add this prop
								/>
							)}
							{selectedAgent && !selectedAgentModel && (
								<div className='text-gray-500 text-sm'>Loading agent details...</div>
							)}

							{/* Agent Tools and Connections Editor */}
							{selectedAgent && selectedAgentModel && (
								<div className='bg-gray-100 p-6 rounded-lg flex flex-col gap-2'>
									<div className='flex items-center justify-between'>
										<h4 className='text-sm text-foreground font-medium'>
											Agent Tools & Connections
										</h4>
									</div>
									<p className='text-sm text-gray-600'>
										Equip your agent with essential tools and data to perform tasks effectively.
									</p>

									<div className='flex flex-col gap-4 text-xs'>
										<div className='text-xs text-gray-500 mb-2'>
											Selected Tools: {agentToolState?.length || 0} | Available Tools:{' '}
											{toolChoices?.filter(t => (t?.type as ToolType) !== ToolType.RAG_TOOL)
												?.length || 0}
										</div>
										<MultiSelect
											className='bg-white mt-4'
											placeholder={
												<div className='flex items-center gap-2'>
													<Database className='h-4 w-4' />
													<p>Tools</p>
												</div>
											}
											newCallback={() => setModalOpen('tool')}
											newLabel='New Tool'
											options={
												toolChoices
													?.filter(t => (t?.type as ToolType) !== ToolType.RAG_TOOL)
													.map(t => ({
														label: t.name,
														value: t._id.toString()
													})) || []
											}
											onValueChange={values => {
												const formattedValues = Array.isArray(values) ? values : [];
												setAgentToolState(formattedValues);
											}}
											value={agentToolState || []}
										/>

										<div className='text-xs text-gray-500 mb-2'>
											Selected Connections: {agentDatasourceState?.length || 0} | Available
											Connections:{' '}
											{toolChoices?.filter(t => (t?.type as ToolType) === ToolType.RAG_TOOL)
												?.length || 0}
										</div>
										<MultiSelect
											className='bg-white'
											placeholder={
												<div className='flex items-center gap-2'>
													<Database className='h-4 w-4' />
													<p>Connections</p>
												</div>
											}
											newCallback={() => setModalOpen('datasource')}
											newLabel='New Connection'
											options={
												toolChoices
													?.filter(t => (t?.type as ToolType) === ToolType.RAG_TOOL)
													.map(t => ({
														label: t.name,
														value: t._id.toString()
													})) || []
											}
											onValueChange={values => {
												const formattedValues = Array.isArray(values) ? values : [];
												setAgentDatasourceState(formattedValues);
											}}
											value={agentDatasourceState || []}
										/>
									</div>
								</div>
							)}
							{!selectedAgent && agentChoices?.length > 0 && (
								<AgentSelectDisplay
									agentChoices={agentChoices}
									toolChoices={toolChoices}
									setSelectedAgent={setSelectedAgent}
									setOpenEditSheet={setOpenEditSheet}
								/>
							)}

							{/* FOR EDITING */}
							{(agentChoices?.length === 0 || openEditSheet) && selectedAgent && (
								<CreateAgentSheet
									editing={true}
									selectedAgent={selectedAgent}
									openEditSheet={openEditSheet}
									setOpenEditSheet={setOpenEditSheet}
									callback={async (agentId, agent) => {
										await fetchFormData();
										setOpenEditSheet(false);
										setPendingAgentId(agentId);
									}}
								/>
							)}

							{/* FOR ADDING */}
							{(agentChoices?.length === 0 || openEditSheet) && !selectedAgent && (
								<CreateAgentSheet
									editing={false}
									selectedAgent={selectedAgent}
									openEditSheet={openEditSheet}
									setOpenEditSheet={setOpenEditSheet}
									callback={async (agentId, agent) => {
										await fetchFormData();
										setOpenEditSheet(false);
										setPendingAgentId(agentId);
									}}
								/>
							)}

							<div className='w-full flex flex-col justify-between bg-gray-100 p-6 rounded-lg gap-2'>
								<p className='text-gray-500'>Conversation starters</p>
								{conversationStarters.map(starter => (
									<div key={starter.id} className='flex items-center gap-2'>
										<div
											className='bg-gray-50 px-4 py-3 w-full border border-gray-300 rounded-lg'
											onClick={() => setEditingStarterId(starter.id)}>
											{editingStarterId === starter.id ? (
												<input
													type='text'
													value={starter.text}
													onChange={e => handleStarterEdit(starter.id, e.target.value)}
													onBlur={() => {
														if (!starter.text.trim()) {
															handleStarterDelete(starter.id);
														}
														setEditingStarterId(null);
													}}
													onKeyDown={e => {
														if (e.key === 'Enter') {
															if (!starter.text.trim()) {
																handleStarterDelete(starter.id);
															}
															setEditingStarterId(null);
														}
													}}
													className='w-full bg-transparent text-sm text-gray-500 outline-none'
													placeholder='Type a conversation starter'
													autoFocus
												/>
											) : (
												<p className='text-sm text-gray-500'>{starter.text}</p>
											)}
										</div>
										<Trash2
											color='#9CA3AF'
											className='cursor-pointer hover:text-red-500'
											onClick={() => handleStarterDelete(starter.id)}
										/>
									</div>
								))}
								<p
									className='text-[#4F46E5] cursor-pointer self-end hover:text-[#3730a3]'
									onClick={handleAddStarter}>
									+ Add
								</p>
							</div>
							{/* <div className='w-full flex items-center justify-between bg-gray-100 p-6 rounded-lg'>
								<p className='text-gray-500'>Display Settings</p>
								<DropdownMenu>
									<DropdownMenuTrigger className='bg-background rounded-sm border border-gray-200'>
										<ChevronDown width={25} color='#6B7280' />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem>Dropdown Item</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div> */}

							<SharingModeSelect
								sharingMode={sharingMode}
								setSharingMode={setSharingMode}
								showInfoAlert={true}
								setShareLinkShareId={setShareLinkShareId}
								shareLinkShareId={shareLinkShareId}
								emailState={sharingEmailState}
								emailOptions={initialEmails}
								onChange={setSharingEmailState}
								setModalOpen={x => {
									setModalOpen('whitelist');
								}}
								shareEmail={shareEmail}
								setShareEmail={setShareEmail}
							/>
							<div className='sm:col-span-'>
								<label
									htmlFor='maxMessages'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Max Messages
								</label>
								<input
									required
									type='number'
									name='maxMessages'
									id='maxMessages'
									value={maxMessages}
									onChange={e => {
										setMaxMessages(parseInt(e.target.value, 10));
									}}
									className='mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								/>
							</div>
						</article>
						<article className='flex items-center justify-between px-6 py-3 border-t border-gray-200'>
							<Button
								type='button'
								variant='ghost'
								className='bg-transparent text-foreground hover:bg-transparent hover:text-foreground p-0 border-0 shadow-none outline-none'>
								Cancel
							</Button>
							<Button
								onClick={() => setRun(false)}
								variant='ghost'
								className='ml-auto bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white font-medium text-sm py-2 hover:text-white'>
								Save
							</Button>
							<Button
								type='submit'
								onClick={() => {
									setRun(true);
								}}
								variant='ghost'
								className='ml-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white font-medium text-sm py-2 hover:text-white'>
								Save & Launch
							</Button>
						</article>
					</form>
				</div>
			)}
			{modal}
		</main>
	);
}
