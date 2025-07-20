import * as API from '@api';
import { AgentCreatedDisplay } from 'components/apps/AgentCreatedDisplay';
import { AgentSelectDisplay } from 'components/apps/AgentSelectDisplay';
import { CreateAgentSheet } from 'components/apps/CreateAgentSheet';
import { InsightChat } from 'components/apps/InsightChat';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import { useThemeContext } from 'context/themecontext';
import { AppsDataReturnType } from 'controllers/app';
import { ChevronDown, Circle, Layout, Pencil, SendHorizonal, Trash2 } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAgentStore } from 'store/agent';

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

export default function Apps(props: AppsDataReturnType) {
	// const { agents } = useAgentStore();
	const [hasLaunched, setHasLaunched] = useState<boolean>(false);
	const [agentDisplay, setAgentDisplay] = useState<boolean>(false);
	const [openEditSheet, setOpenEditSheet] = useState<boolean>(false);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [appTitle, setAppTitle] = useState<string>('Untitled Chat App');
	const [editingStarterId, setEditingStarterId] = useState<number | null>(null);
	const [starters, setStarters] = useState([
		{ id: 1, text: 'Help me brainstorm some ideas' },
		{ id: 2, text: 'What can you help me with?' }
	]);

	const handleStarterEdit = (id: number, newText: string) => {
		setStarters(
			starters.map(starter => (starter.id === id ? { ...starter, text: newText } : starter))
		);
	};

	const handleStarterDelete = (id: number) => {
		setStarters(starters.filter(starter => starter.id !== id));
	};

	const handleAddStarter = () => {
		const newId = Math.max(0, ...starters.map(s => s.id)) + 1;
		const newStarter = { id: newId, text: '' };
		setStarters([...starters, newStarter]);
		setEditingStarterId(newId);
	};

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<AppsDataReturnType>(props);
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const { step, setStep }: any = useStepContext();
	const [loading, setLoading] = useState(true);
	const { apps, tools, agents, tasks, models, datasources, teamMembers, variables } = state;

	const { theme } = useThemeContext();

	async function fetchAppFormData() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	async function fetchEditData(appId) {
		await API.getApp({ resourceSlug, appId }, setCloneState, setError, router);
	}

	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	useEffect(() => {
		if (typeof location != undefined) {
			const appId = new URLSearchParams(location.search).get('appId');
			if (appId) {
				fetchEditData(appId);
			}
		}
	}, []);

	useEffect(() => {
		if (cloneState) {
			if (cloneState?.app?.type === 'chat') {
				setStep(1);
			}
			if (cloneState?.app?.type === 'crew') {
				setStep(2);
			}
		}
	}, [cloneState]);

	const handleCreateChatApp = () => {
		setStep(1);
	};

	const handleCreateProcessApp = () => {
		setStep(2);
	};

	useEffect(() => {
		if (typeof location != undefined) {
			const appId = new URLSearchParams(location.search).get('appId');
			if (
				(appId && state?.apps && (cloneState?.app?.crew || cloneState?.app?.type === 'chat')) ||
				(!appId && state?.apps)
			) {
				setLoading(false);
			}
		}
	}, [state?.apps, cloneState?.app]);

	if (loading) {
		return <Spinner />;
	}

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
					<section className='flex flex-col justify-between border border-gray-200 rounded-l-lg w-full minh-[790px]'>
						<article className='flex flex-col p-5 gap-6'>
							<div className='flex items-center gap-3 h-24'>
								<img className='rounded-3xl' src='/apps/identicon.png' />
								<div className='w-full h-full flex flex-col justify-around'>
									<div className='w-full flex justify-between'>
										<div className='flex items-center gap-2'>
											{isEditing ? (
												<input
													type='text'
													value={appTitle}
													onChange={e => setAppTitle(e.target.value)}
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
												<p className='font-semibold text-lg'>{appTitle}</p>
											)}
											<button
												onClick={() => setIsEditing(!isEditing)}
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
										className='w-full h-full rounded-lg mt-2 text-gray-500 px-4 py-2 bg-gray-50 border border-gray-300'
										placeholder='Describe the essential tasks and goals this chat app aims to
                    achieve.'
									/>
								</div>
							</div>

							{agentDisplay ? (
								<AgentCreatedDisplay
									// setAgentDisplay={setAgentDisplay}
									setOpenEditSheet={setOpenEditSheet}
									setSelectedAgent={() => {}}
									openEditSheet={openEditSheet}
									selectedAgent={null}
									selectedAgentModel={null}
									selectedAgentTools={[]}
									onChangeAgent={() => {}}
									isUpdating={false}
								/>
							) : agents.length > 0 ? (
								<AgentSelectDisplay
									// setAgentDisplay={setAgentDisplay}
									setOpenEditSheet={setOpenEditSheet}
									setSelectedAgent={() => {}}
									agentChoices={agents}
									toolChoices={[]}
								/>
							) : (
								<CreateAgentSheet
									// setAgentDisplay={setAgentDisplay}
									openEditSheet={openEditSheet}
									setOpenEditSheet={setOpenEditSheet}
								/>
							)}
							<div className='w-full flex flex-col justify-between bg-gray-100 p-6 rounded-lg gap-2'>
								<p className='text-gray-500'>Conversation starters</p>
								{starters.map(starter => (
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
							<div className='w-full flex items-center justify-between bg-gray-100 p-6 rounded-lg'>
								<p className='text-gray-500'>Display Settings</p>
								<DropdownMenu>
									<DropdownMenuTrigger className='bg-background rounded-sm border border-gray-200'>
										<ChevronDown width={25} color='#6B7280' />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem>Dropdown Item</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</article>
						<article className='flex items-center justify-between px-3 py-3 border-t border-gray-200'>
							<Button
								variant='ghost'
								className='bg-transparent text-foreground hover:bg-transparent hover:text-foreground p-0 border-0 shadow-none outline-none'>
								Cancel
							</Button>
							<Button
								onClick={() => setHasLaunched(true)}
								variant='ghost'
								className='bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white font-medium text-sm py-2 hover:text-white'>
								Launch &gt;
							</Button>
						</article>
					</section>

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
