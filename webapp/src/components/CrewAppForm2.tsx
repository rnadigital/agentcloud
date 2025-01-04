'use strict';

import * as API from '@api';
import { InformationCircleIcon, PlayIcon } from '@heroicons/react/20/solid';
import AddEmailModal from 'components/AddEmailModal';
import AgentsSelect from 'components/agents/AgentsSelect';
import AvatarUploader from 'components/AvatarUploader';
import ConfirmModal from 'components/ConfirmModal';
import CreateAgentModal from 'components/CreateAgentModal';
import CreateModelModal from 'components/CreateModelModal';
import CreateTaskModal from 'components/CreateTaskModal';
import InfoAlert from 'components/InfoAlert';
import ModelSelect from 'components/models/ModelSelect';
import ToolTip from 'components/shared/ToolTip';
import SharingModeSelect from 'components/SharingModeSelect';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import { Model } from 'db/model';
import { ObjectId } from 'mongodb';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
// import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { Agent } from 'struct/agent';
import { App, AppType } from 'struct/app';
import { ProcessImpl } from 'struct/crew';
import { ModelType } from 'struct/model';
import { SharingMode } from 'struct/sharing';
import { Task } from 'struct/task';
import { Variable } from 'struct/variable';
import Foo from './Foo';
import { Circle, Pencil } from 'lucide-react';
import { InsightChat } from './apps/InsightChat';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';

export default function CrewAppForm({
	agentChoices = [],
	taskChoices = [],
	modelChoices = [],
	variableChoices = [],
	whiteListSharingChoices = [],
	crew = {},
	app,
	editing,
	compact = false,
	callback,
	fetchFormData
}: {
	agentChoices?: Agent[];
	taskChoices?: Task[];
	crew?: any;
	modelChoices: Model[];
	whiteListSharingChoices?: any[];
	app?: App;
	editing?: boolean;
	compact?: boolean;
	callback?: Function;
	fetchFormData?: Function;
	variableChoices?: Variable[];
}) {
	//TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const { step, setStep }: any = useStepContext();
	const [outsideOrg, setOutsideOrg] = useState(false);
	const [shareEmail, setShareEmail] = useState(false);
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
	const [shareLinkShareId, setShareLinkShareId] = useState(editing ? app?.shareLinkShareId : null);
	const [appMemory, setAppMemory] = useState(app?.memory === true);
	const [appCache, setAppCache] = useState(app?.cache === true);
	const [fullOutput, setFullOutput] = useState(crew.fullOutput === true);
	const [description, setDescription] = useState(app?.description || '');
	console.log('crew ', crewState);
	console.log('app', appState);
	const { name, agents, tasks, verbose } = crewState || {};
	const [verboseInt, setVerboseInt] = useState(verbose || 0);
	const [process, setProcess] = useState(crewState?.process || ProcessImpl.SEQUENTIAL);
	const [run, setRun] = useState(false);
	const [isEditing, setIsEditing] = useState<boolean>(false);

	const [hasLaunched, setHasLaunched] = useState<boolean>(false);
	const [appName, setAppName] = useState(app?.name || '');

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

	const initialEmails = whiteListSharingChoices
		? whiteListSharingChoices.map(email => ({ label: email, value: email }))
		: null;
	const [sharingEmailState, setSharingEmailState] = useState(
		Object.values(app?.sharingConfig?.permissions || {}).map(x => ({
			label: x as string,
			value: x as string
		}))
	);

	const { initialAgents, initialTasks } = getInitialData({ agents, tasks });
	const [agentsState, setAgentsState] = useState(initialAgents || []);
	const [icon, setIcon] = useState(app?.icon);
	const [tasksState, setTasksState] = useState<{ label: string; value: string }[]>(
		initialTasks || []
	);

	const taskIDs = tasksState?.map(t => t.value);
	const selectedTasks = taskIDs?.map(t => taskChoices.find(tc => tc._id === t));
	const variableIdsOfSelectedTasks = selectedTasks?.map(t => t?.variableIds || []).flat();
	const variablesOfSelectedTasks = variableIdsOfSelectedTasks
		?.map(v => variableChoices?.find(vc => vc._id === v))
		.filter(v => v !== undefined);

	const agentIds = agentsState?.map(a => a.value);
	const selectedAgents = agentIds?.map(a => agentChoices.find(ac => ac._id === a));
	const variableIdsOfSelectedAgents = selectedAgents?.map(a => a?.variableIds || []).flat();
	const variablesOfSelectedAgents = variableIdsOfSelectedAgents
		?.map(v => variableChoices?.find(vc => vc._id === v))
		.filter(v => v !== undefined);

	const combinedVariables = Array.from(
		new Set([...(variablesOfSelectedTasks || []), ...(variablesOfSelectedAgents || [])])
	);

	const [kickOffVariables, setKickOffVariables] = useState<{ label: string; value: string }[]>(
		variableChoices
			.filter(v => app?.kickOffVariablesIds?.includes(v._id as ObjectId))
			.map(v => ({
				label: v.name,
				value: v._id.toString()
			}))
	);

	const missingAgents: Agent[] = tasksState?.reduce((acc, t) => {
		const task = taskChoices.find(tc => tc._id === t.value);
		if (task && !agentsState.some(a => a.value === task.agentId)) {
			const missingAgent = agentChoices.find(ac => ac._id === task.agentId);
			if (missingAgent && !acc.some(a => a._id === missingAgent._id)) acc.push(missingAgent);
		}
		return acc;
	}, []);

	async function appPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			description,
			process,
			agents: agentsState.map(a => a.value),
			memory: appMemory,
			cache: appCache,
			managerModelId: managerModel?.value,
			tasks: tasksState.map(x => x.value),
			iconId: icon?.id,
			type: AppType.CREW,
			run,
			sharingMode,
			sharingEmails: sharingEmailState.map(x => x?.label.trim()).filter(x => x),
			shareLinkShareId,
			verbose: verboseInt,
			fullOutput,
			cloning: app && !editing,
			kickOffVariablesIds: kickOffVariables?.map(v => v.value)
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
		(await fetchFormData) && fetchFormData();
		setAgentsState(oldAgentsState => {
			return oldAgentsState.concat({ label: body.name, value: addedAgentId });
		});
		setModalOpen(false);
	}

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

	async function emailCallback(newEmail) {
		setSharingEmailState(() => [...sharingEmailState, { label: newEmail, value: newEmail }]);
		setOutsideOrg(true);
		setModalOpen(false);
	}

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

	useEffect(() => {
		if (sharingMode !== SharingMode.WHITELIST) {
			setSharingEmailState([]);
		}
	}, [sharingMode]);

	return (
		<main className='text-foreground flex flex-col gap-2'>
			{modal}
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
												onClick={e => {
													e.preventDefault();
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
						</article>
						<section className='border border-gray-200 rounded-lg mx-6'>
							<div className='flex w-full items-center bg-gray-100 px-4 py-2'>
								<h4 className='text-gray-700 font-semibold'>Tasks</h4>
								<div className='ml-auto'>Execution order:</div>
								<Select value={process} onValueChange={setProcess}>
									<SelectTrigger className='w-[180px]'>
										<SelectValue placeholder='Sequential' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ProcessImpl.SEQUENTIAL}>Sequential</SelectItem>
										<SelectItem value={ProcessImpl.HIERARCHICAL}>Hierarchical</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Foo taskChoices={taskChoices} setModalOpen={setModalOpen} />
							</div>
						</section>
					</form>
				</div>
			)}
		</main>
	);
}
