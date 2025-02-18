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
	const [conversationStarters, setConversationStarters] = useState([
		{ id: 1, text: 'Help me brainstorm some ideas' },
		{ id: 2, text: 'What can you help me with?' }
	]);
	const [pendingAgentId, setPendingAgentId] = useState<string>();
	const [run, setRun] = useState(false);
	const [outsideOrg, setOutsideOrg] = useState(false);
	const [modalOpen, setModalOpen]: any = useState(false);

	const [isAgentUpdating, setIsAgentUpdating] = useState(false);

	const selectedAgentModel = modelChoices.find(model => model._id === selectedAgent?.modelId);
	const selectedAgentTools = toolChoices.filter(tool => selectedAgent?.toolIds?.includes(tool._id));

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
	const [maxMessages, setMaxMessages] = useState(app?.chatAppConfig.maxMessages || 30);

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
		default:
			modal = null;
			break;
	}

	async function appPost(e) {
		e.preventDefault();
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
						onSubmit={appPost}
					>
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
												className='hover:text-[#4F46E5] transition-colors'
											>
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
							{selectedAgent && (
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
											onClick={() => setEditingStarterId(starter.id)}
										>
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
									onClick={handleAddStarter}
								>
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
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
								>
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
								className='bg-transparent text-foreground hover:bg-transparent hover:text-foreground p-0 border-0 shadow-none outline-none'
							>
								Cancel
							</Button>
							<Button
								onClick={() => setRun(false)}
								variant='ghost'
								className='ml-auto bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white font-medium text-sm py-2 hover:text-white'
							>
								Save
							</Button>
							<Button
								type='submit'
								onClick={() => {
									setRun(true);
								}}
								variant='ghost'
								className='ml-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white font-medium text-sm py-2 hover:text-white'
							>
								Save & Launch
							</Button>
						</article>
					</form>

					<section className='border border-gray-200 rounded-r-lg w-96 flex flex-col justify-between hidden md:flex'>
						<article className='flex flex-col justify-center items-center h-full'>
							<p className='text-gray-500 text-center'>
								Preview will update as you add your agent’s details
							</p>
						</article>

						<article className='flex items-center gap-3 px-3 py-3 border-t border-gray-200'>
							<input
								className='bg-gray-50 border border-gray-300 px-4 py-2 rounded-lg text-gray-500 text-sm w-full'
								type='text'
								placeholder='Write your message here...'
							/>
							<SendHorizonal color='#4F46E5' />
						</article>
					</section>
				</div>
			)}
		</main>
	);
}
