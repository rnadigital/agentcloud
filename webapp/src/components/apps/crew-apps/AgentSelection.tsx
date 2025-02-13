import React from 'react';
import { Agent } from 'struct/agent';
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Tool, ToolType } from 'struct/tool';
import { Model } from 'db/model';
import { NewAgentSheet } from 'components/agents/NewAgentSheet';

type AgentsState = {
	label: string;
	value: string;
	allowDelegation?: boolean;
}[];

const AgentSelection = ({
	agentChoices,
	agentState,
	setAgentState,
	toolChoices,
	modelChoices,
	createAgentCallback,
	missingAgents
}: {
	agentChoices: Agent[];
	agentState: AgentsState;
	setAgentState: (agentState: AgentsState) => void;
	toolChoices: Tool[];
	modelChoices: Model[];
	createAgentCallback: (addedAgentId: string, body: any) => void;
	missingAgents: Agent[];
}) => {
	const [showAgentSelect, setShowAgentSelect] = React.useState(false);
	const [searchTerm, setSearchTerm] = React.useState('');
	const [availableAgents, setAvailableAgents] = React.useState(agentChoices);
	const [openEditSheet, setOpenEditSheet] = React.useState(false);

	const handleAgentSelect = (agent: Agent) => {
		const newAgentState = [
			...agentState,
			{
				label: agent.name,
				value: agent._id as string,
				allowDelegation: agent.allowDelegation
			}
		];
		setAgentState(newAgentState);
		setAvailableAgents(availableAgents.filter(a => a._id !== agent._id));
		setShowAgentSelect(false);
	};

	const handleAgentRemove = (e: React.MouseEvent, agentId: string) => {
		e.preventDefault();
		const removedAgent = agentChoices.find(a => a._id === agentId);
		if (removedAgent) {
			setAvailableAgents([...availableAgents, removedAgent]);
			setAgentState(agentState.filter(a => a.value !== agentId));
		}
	};

	const filteredAgents = availableAgents.filter(agent =>
		agent.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className='p-6 bg-gray-50'>
			<NewAgentSheet
				openEditSheet={openEditSheet}
				setOpenEditSheet={setOpenEditSheet}
				callback={createAgentCallback}
			/>
			<h2 className='font-semibold mb-2'>Process-Level Agents</h2>
			<p className='text-gray-600 mb-4'>
				Process agents assist multiple tasks, enhance collaboration, and act as backups when
				task-specific agents need support.
			</p>
			<div className='w-full gap-2 grid grid-cols-1 lg:grid-cols-2'>
				{agentState.map(agentItem => {
					const selectedAgent = agentChoices.find(a => a._id === agentItem.value);
					const tools = toolChoices.filter(tool =>
						selectedAgent?.toolIds?.includes(tool._id.toString())
					);
					const model = modelChoices.find(
						model => selectedAgent?.modelId?.toString() === model._id?.toString()
					);
					return (
						<div key={agentItem.value} className='bg-white p-4 rounded-lg mb-4 border text-sm'>
							<div className='flex items-start'>
								<img src='/apps/identicon.png' className='w-12 h-12 rounded-full mr-3' />
								<div className='flex-1'>
									<h3 className='font-semibold'>{agentItem.label}</h3>
									<p className='text-gray-600'>Social Media Manager</p>
									<div className='flex gap-2 mt-2 flex-wrap max-h-[60px] overflow-auto'>
										{tools.map((tool, index) => (
											<>
												<span className='flex items-center text-gray-500'>
													<span className='mr-2'>
														{tool.type === ToolType.RAG_TOOL ? '🗄️' : '🔧'}
													</span>
													{tool.name}
												</span>
												{index < tools.length - 1 && <div className='h-4 w-px bg-gray-300'></div>}
											</>
										))}
									</div>

									<div className='mt-2'>
										<span className='flex items-center text-gray-500'>
											<span className='mr-2'>🤖</span>
											{model?.name}
										</span>
									</div>
								</div>
								<button
									onClick={e => handleAgentRemove(e, agentItem.value)}
									className='text-gray-400 hover:text-gray-600'
								>
									<XMarkIcon className='w-5 h-5' />
								</button>
							</div>
						</div>
					);
				})}
			</div>
			{!showAgentSelect ? (
				<div>
					<button
						onClick={() => setShowAgentSelect(true)}
						className='text-blue-600 hover:text-blue-700 flex items-center gap-2'
					>
						<PlusIcon className='w-5 h-5' />
						Add Agent
					</button>
					{missingAgents.length > 0 && (
						<>
							<div className='text-sm font-medium text-gray-700 mt-4 mb-2'>Required Agents</div>
							<div className='flex gap-2 flex-wrap'>
								{missingAgents.map(agent => (
									<button
										key={agent._id as string}
										onClick={() => handleAgentSelect(agent)}
										className='text-gray-600 hover:text-blue-600'
									>
										{agent.name}
									</button>
								))}
							</div>
						</>
					)}
				</div>
			) : (
				<div className='bg-white border rounded-lg p-4'>
					<div className='flex justify-between items-center mb-4'>
						<h3 className='font-semibold'>Agents</h3>
						<div className='flex gap-2'>
							<button
								className='flex items-center gap-1 border rounded-lg px-4 py-2'
								onClick={e => {
									e.preventDefault();
									setOpenEditSheet(true);
								}}
							>
								<PlusIcon className='w-5 h-5' />
								New Agent
							</button>
							<button
								onClick={() => setShowAgentSelect(false)}
								className='text-gray-400 hover:text-gray-600'
							>
								<XMarkIcon className='w-5 h-5' />
							</button>
						</div>
					</div>
					<div className='relative mb-4'>
						<MagnifyingGlassIcon className='w-5 h-5 absolute left-3 top-2.5 text-gray-400' />
						<input
							type='text'
							placeholder='Search Agent'
							className='w-full pl-10 pr-4 py-2 border rounded-lg'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
					</div>
					<div className='grid grid-cols-3 gap-4'>
						{filteredAgents.map(agent => {
							const tools = toolChoices.filter(tool =>
								agent.toolIds?.includes(tool._id.toString())
							);
							const model = modelChoices.find(
								model => agent.modelId?.toString() === model._id?.toString()
							);
							return (
								<div
									key={agent._id as string}
									className='border rounded-lg p-4 cursor-pointer hover:border-blue-500 flex flex-col'
									onClick={() => handleAgentSelect(agent)}
								>
									<img src='/apps/identicon.png' className='w-12 h-12 rounded-full mb-2' />
									<h4 className='font-semibold'>{agent.name}</h4>
									<p className='text-gray-600 text-sm'>{agent.role}</p>
									<div className='mt-2 mb-4 text-sm text-gray-500'>
										{tools.map(tool => (
											<div className='flex items-center gap-1'>
												<span>🔧</span>
												<span>{tool.name}</span>
											</div>
										))}
									</div>
									<button className='w-full mt-auto py-2 text-center border rounded-lg'>
										Select
									</button>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

export default AgentSelection;
