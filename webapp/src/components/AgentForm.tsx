'use strict';

import * as API from '@api';
import AvatarUploader from 'components/AvatarUploader';
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import CreateModelModal from 'components/CreateModelModal';
import CreateToolModal from 'components/modal/CreateToolModal';
import ModelSelect from 'components/models/ModelSelect';
import Spinner from 'components/Spinner';
import ToolsSelect from 'components/tools/ToolsSelect';
import { useAccountContext } from 'context/account';
import { AgentDataReturnType, AgentsDataReturnType } from 'controllers/agent';
import useAutocompleteDropdown from 'hooks/useAutoCompleteDropdown';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CollectionName } from 'struct/db';
import { ModelEmbeddingLength, ModelType } from 'struct/model';
import { ToolType } from 'struct/tool';

import CreateVariableModal from './variables/CreateVariableModal';
import AutocompleteDropdown from './variables/VariableDropdown';

export default function AgentForm({
	agent,
	models = [],
	tools = [],
	variables = [],
	groups = [],
	editing,
	compact = false,
	callback,
	fetchAgentFormData
}: {
	agent?: AgentDataReturnType['agent'];
	models?: AgentsDataReturnType['models'];
	tools?: AgentsDataReturnType['tools'];
	variables?: AgentsDataReturnType['variables'];
	groups?: any[];
	editing?: boolean;
	compact?: boolean;
	callback?: Function;
	fetchAgentFormData?: Function;
}) {
	//TODO: fix any types
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen]: any = useState<string>();
	const [callbackKey, setCallbackKey] = useState(null);
	const [allowDelegation, setAllowDelegation] = useState(agent?.allowDelegation);
	const [verbose, setVerbose] = useState(agent?.verbose);
	const [icon, setIcon] = useState(agent?.icon);
	const [agentState, setAgent] = useState<Partial<AgentDataReturnType['agent']>>(agent || {});
	const name = agentState?.name;
	const modelId = agentState?.modelId;
	const functionModelId = agentState?.functionModelId;
	const posthog = usePostHog();

	const [backstory, setBackstory] = useState<string>();
	const [goal, setGoal] = useState<string>();
	const [role, setRole] = useState<string>();

	const [currentInput, setCurrentInput] = useState<string>();

	const [backstorySelectedVariables, setBackstorySelectedVariables] = useState<string[]>([]);

	const [goalSelectedVariables, setGoalSelectedVariables] = useState<string[]>([]);

	const [roleSelectedVariables, setRoleSelectedVariables] = useState<string[]>([]);

	const backstoryVariableOptions = variables.map(v => ({ label: v.name, value: v._id.toString() }));

	const goalVariableOptions = variables.map(v => ({ label: v.name, value: v._id.toString() }));

	const roleVariableOptions = variables.map(v => ({ label: v.name, value: v._id.toString() }));

	const autocompleteBackstory = useAutocompleteDropdown({
		value: backstory,
		options: backstoryVariableOptions,
		setValue: setBackstory,
		setSelectedVariables: setBackstorySelectedVariables,
		setModalOpen,
		initialState: variables,
		setCurrentInput,
		fetchFormData: fetchAgentFormData
	});

	const autocompleteGoal = useAutocompleteDropdown({
		value: goal,
		options: goalVariableOptions,
		setValue: setGoal,
		setSelectedVariables: setGoalSelectedVariables,
		setModalOpen,
		initialState: variables,
		setCurrentInput,
		fetchFormData: fetchAgentFormData
	});

	const autocompleteRole = useAutocompleteDropdown({
		value: role,
		options: roleVariableOptions,
		setValue: setRole,
		setSelectedVariables: setRoleSelectedVariables,
		setModalOpen,
		initialState: variables,
		setCurrentInput,
		fetchFormData: fetchAgentFormData
	});

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

	useEffect(() => {
		setAgent(agent);
		setIcon(agent?.icon);
		setBackstory(agent?.backstory);
		setGoal(agent?.goal);
		setRole(agent?.role);
		//if there's an icon and editing is false then we need to create a new icon
		const { initialTools, initialDatasources } = (agent?.toolIds || []).reduce(getInitialTools, {
			initialTools: [],
			initialDatasources: []
		});
		setToolState(initialTools.length > 0 ? initialTools : null);
		if (models && models.length > 0 && !modelId) {
			setAgent({
				...agentState,
				modelId: models.find(m => !ModelEmbeddingLength[m.model])?._id,
				functionModelId: models.find(m => !ModelEmbeddingLength[m.model])?._id
			});
		}

		setDatasourceState(initialDatasources.length > 0 ? initialDatasources : null);
	}, [agent?._id]);

	const { initialTools, initialDatasources } = (agent?.toolIds || []).reduce(getInitialTools, {
		initialTools: [],
		initialDatasources: []
	});
	const [toolState, setToolState] = useState(initialTools.length > 0 ? initialTools : null);
	const [datasourceState, setDatasourceState] = useState(
		initialDatasources.length > 0 ? initialDatasources : null
	); //Note: still technically tools, just only RAG tools

	useEffect(() => {
		if (models && models.length > 0 && !modelId) {
			setAgent({
				...agentState,
				modelId: models.find(m => !ModelEmbeddingLength[m.model])?._id,
				functionModelId: models.find(m => !ModelEmbeddingLength[m.model])?._id
			});
		}
	}, []);

	async function agentPost(e) {
		e.preventDefault();
		posthog.capture(editing ? 'updateAgent' : 'createAgent', {
			name: e.target.name.value,
			tools: (toolState || []).length,
			datasources: (datasourceState || []).length,
			modelId,
			functionModelId
		});
		const body: any = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			modelId,
			functionModelId,
			allowDelegation: allowDelegation === true,
			verbose: verbose === true,
			role: e.target.role.value,
			goal: e.target.goal.value,
			backstory: e.target.backstory.value,
			toolIds: (toolState || [])
				.map(x => x.value)
				.concat((datasourceState || []).map(x => x.value)),
			iconId: icon?.id,
			variableIds:
				Array.from(
					new Set([
						...roleSelectedVariables,
						...goalSelectedVariables,
						...backstorySelectedVariables
					])
				) || [],
			cloning: agent && !editing
		};
		if (editing) {
			await API.editAgent(
				agentState._id,
				body,
				() => {
					toast.success('Agent Updated');
				},
				res => {
					toast.error(res);
				},
				null
			);
		} else {
			const addedAgent: any = await API.addAgent(
				body,
				() => {
					toast.success('Added new agent');
				},
				res => {
					toast.error(res);
				},
				compact ? null : router
			);
			callback && addedAgent && callback(addedAgent._id, body);
		}
	}

	const modelCallback = async addedModelId => {
		(await fetchAgentFormData) && fetchAgentFormData();
		setModalOpen(false);
		setAgent(oldAgent => {
			return {
				...oldAgent,
				[callbackKey as any]: addedModelId
			};
		});
		setCallbackKey(null);
	};
	async function createDatasourceCallback(createdDatasource) {
		(await fetchAgentFormData) && fetchAgentFormData();
		setDatasourceState({ label: createdDatasource.name, value: createdDatasource.datasourceId });
		setModalOpen(false);
	}
	const toolCallback = async (addedToolId, body) => {
		(await fetchAgentFormData) && fetchAgentFormData();
		setModalOpen(false);
		setToolState([
			{ label: `${body.name} (${body.type}) - ${body.description}`, value: addedToolId }
		]);
	};

	const iconCallback = async addedIcon => {
		(await fetchAgentFormData) && fetchAgentFormData();
		setModalOpen(false);
		setIcon({ id: addedIcon?._id, ...addedIcon });
	};

	if (agent === null) {
		return <Spinner />;
	}

	const handleNewVariableCreation = (newVariable: { label: string; value: string }) => {
		switch (currentInput) {
			case 'backstory':
				autocompleteBackstory.handleNewVariableCreation(newVariable);
				break;
			case 'goal':
				autocompleteGoal.handleNewVariableCreation(newVariable);
				break;
			case 'role':
				autocompleteRole.handleNewVariableCreation(newVariable);
				break;
			default:
				break;
		}
	};

	let modal;
	switch (modalOpen) {
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
						ModelType.OLLAMA,
						// ModelType.COHERE,
						ModelType.ANTHROPIC,
						ModelType.GOOGLE_VERTEX,
						ModelType.GOOGLE_AI
					]}
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
		case 'variable':
			modal = (
				<CreateVariableModal
					open={modalOpen !== false}
					setOpen={setModalOpen}
					callback={handleNewVariableCreation}
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
			<form onSubmit={agentPost}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='space-y-4'>
					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
						<div className='sm:col-span-12'>
							<label
								htmlFor='name'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'
							>
								Avatar
							</label>
							<div className='mt-2'>
								<AvatarUploader
									existingAvatar={icon}
									callback={iconCallback}
									isDialogOpen={false}
									setIsDialogOpen={() => {}}
								/>
							</div>
						</div>
					</div>

					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
						<div className='sm:col-span-12'>
							<label
								htmlFor='name'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'
							>
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

					<div className='space-y-px rounded-md shadow-sm'>
						<label
							htmlFor='systemMessage'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50 mb-2'
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
								ref={autocompleteRole.inputRef}
								required
								id='role'
								name='role'
								placeholder="Defines the agent's function within the crew. It determines the kind of tasks the agent is best suited for."
								className='relative block w-full border-0 p-2 pt-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={role}
								rows={3}
								value={autocompleteRole.text}
								onChange={autocompleteRole.handleChange}
								onKeyDown={autocompleteRole.handleKeyDown}
							/>

							{autocompleteRole.showDropdown && autocompleteRole.filteredOptions.length > 0 && (
								<AutocompleteDropdown
									closeDropdown={autocompleteRole.closeDropdown}
									options={autocompleteRole.filteredOptions}
									highlightedIndex={autocompleteRole.highlightedIndex}
									dropdownPosition={autocompleteRole.dropdownPosition}
									handleOptionSelect={autocompleteRole.handleOptionSelect}
								/>
							)}
						</div>
						<div className='bg-white dark:bg-slate-800 relative rounded-none px-0 ring-1 ring-outset ring-gray-300 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-600'>
							<label
								htmlFor='goal'
								className='p-2 pb-0 block text-xs font-medium text-gray-900 dark:text-slate-400'
							>
								Goal
							</label>
							<textarea
								ref={autocompleteGoal.inputRef}
								required
								id='goal'
								name='goal'
								placeholder="The individual objective that the agent aims to achieve. It guides the agent's decision-making process."
								className='block w-full border-0 p-2 pt-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={goal}
								rows={2}
								value={autocompleteGoal.text}
								onChange={autocompleteGoal.handleChange}
								onKeyDown={autocompleteGoal.handleKeyDown}
							/>
							{autocompleteGoal.showDropdown && autocompleteGoal.filteredOptions.length > 0 && (
								<AutocompleteDropdown
									options={autocompleteGoal.filteredOptions}
									highlightedIndex={autocompleteGoal.highlightedIndex}
									dropdownPosition={autocompleteGoal.dropdownPosition}
									handleOptionSelect={autocompleteGoal.handleOptionSelect}
									closeDropdown={autocompleteGoal.closeDropdown}
								/>
							)}
						</div>
						<div className='bg-white dark:bg-slate-800 relative rounded-md rounded-t-none px-0 ring-1 ring-outset ring-gray-300 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-600'>
							<label
								htmlFor='backstory'
								className='p-2 pb-0 block text-xs font-medium text-gray-900 dark:text-slate-400'
							>
								Backstory
							</label>
							<textarea
								ref={autocompleteBackstory.inputRef}
								required
								id='backstory'
								name='backstory'
								placeholder="Provides context to the agent's role and goal, enriching the interaction and collaboration dynamics."
								className='block w-full border-0 p-2 pt-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={backstory}
								value={autocompleteBackstory.text}
								onChange={autocompleteBackstory.handleChange}
								onKeyDown={autocompleteBackstory.handleKeyDown}
							/>

							{autocompleteBackstory.showDropdown &&
								autocompleteBackstory.filteredOptions.length > 0 && (
									<AutocompleteDropdown
										closeDropdown={autocompleteBackstory.closeDropdown}
										options={autocompleteBackstory.filteredOptions}
										highlightedIndex={autocompleteBackstory.highlightedIndex}
										dropdownPosition={autocompleteBackstory.dropdownPosition}
										handleOptionSelect={autocompleteBackstory.handleOptionSelect}
									/>
								)}
						</div>
					</div>

					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
						<ToolsSelect
							tools={tools.filter(t => (t?.type as ToolType) !== ToolType.RAG_TOOL)}
							toolState={toolState}
							onChange={toolState => setToolState(toolState)}
							setModalOpen={setModalOpen}
						/>

						<ToolsSelect
							title='Datasources'
							tools={tools.filter(t => (t?.type as ToolType) === ToolType.RAG_TOOL)}
							toolState={datasourceState}
							onChange={setDatasourceState}
							setModalOpen={() => setModalOpen('datasource')}
							enableAddNew={true}
						/>

						<ModelSelect
							models={models}
							modelId={modelId}
							label='Model'
							onChange={model => setAgent(oldAgent => ({ ...oldAgent, modelId: model?.value }))}
							setModalOpen={setModalOpen}
							callbackKey='modelId'
							setCallbackKey={setCallbackKey}
							modelFilter='llm'
						/>
					</div>

					<details>
						<summary className='cursor-pointer mb-4 dark:text-gray-50'>Advanced</summary>
						<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
							<ModelSelect
								models={models}
								modelId={functionModelId}
								label='Function Calling Model'
								onChange={model =>
									setAgent(oldAgent => ({ ...oldAgent, functionModelId: model?.value }))
								}
								setModalOpen={setModalOpen}
								callbackKey='functionModelId'
								setCallbackKey={setCallbackKey}
								modelFilter='llm'
							/>

							<div className='sm:col-span-12'>
								<label
									htmlFor='verbose'
									className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
								>
									<input
										type='checkbox'
										id='verbose'
										name='verbose'
										checked={verbose}
										onChange={e => setVerbose(e.target.checked)}
										className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
									/>
									Verbose
								</label>
								<p className='mt-3 text-sm leading-6 text-gray-600'>
									Enables detailed logging of the agent&apos;s execution for debugging or monitoring
									purposes when enabled.
								</p>
							</div>
						</div>
					</details>
				</div>

				<div className='mt-6 flex items-center justify-between gap-x-6'>
					{!compact && (
						<Link
							className='text-sm font-semibold leading-6 text-gray-900'
							href={`/${resourceSlug}/agents`}
						>
							Back
						</Link>
					)}
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
