import { Model } from 'db/model';
import { Box, ChevronDown, ChevronUp, Cpu, File, Wrench } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from 'modules/components/ui/collapsible';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Blockies from 'react-blockies';
import { useAgentStore } from 'store/agent';
import { Agent } from 'struct/agent';
import { Tool, ToolType } from 'struct/tool';
import { CreateAgentSheet } from './CreateAgentSheet';

// Add memo to prevent unnecessary re-renders
export const AgentCreatedDisplay = React.memo(
	({
		setSelectedAgent,
		openEditSheet,
		setOpenEditSheet,
		selectedAgent,
		selectedAgentModel,
		selectedAgentTools,
		onAgentUpdate,
		isUpdating,
		onChangeAgent // Add this prop
	}: {
		setSelectedAgent: (agent: Agent) => void;
		openEditSheet: boolean;
		setOpenEditSheet: React.Dispatch<React.SetStateAction<boolean>>;
		selectedAgent: Agent;
		selectedAgentModel: Model;
		selectedAgentTools: Tool[];
		onAgentUpdate?: () => Promise<void>;
		isUpdating?: boolean;
		onChangeAgent: () => void; // Add this prop type
	}) => {
		const [isExpanded, setIsExpanded] = useState(true);

		// Handle agent updates through parent's fetch function
		const handleAgentEdit = async (agentId, body) => {
			if (isUpdating) return;

			try {
				// Trigger parent's fetch function first to get fresh data
				if (onAgentUpdate) {
					await onAgentUpdate();
				}

				// Let parent component handle the agent update through its own state management
				setOpenEditSheet(false);
			} catch (error) {
				console.error('Error updating agent:', error);
			}
		};

		// Memoize tools and datasources based on both selectedAgentTools and localAgent
		const { datasources, tools } = useMemo(
			() => ({
				datasources:
					selectedAgentTools?.filter(
						tool => tool.type === ToolType.RAG_TOOL && selectedAgent?.toolIds?.includes(tool._id)
					) || [],
				tools:
					selectedAgentTools?.filter(
						tool => tool.type !== ToolType.RAG_TOOL && selectedAgent?.toolIds?.includes(tool._id)
					) || []
			}),
			[selectedAgentTools, selectedAgent?.toolIds]
		);

		const handleEditClick = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setOpenEditSheet(true);
		};

		return (
			<div className='flex flex-col gap-4 rounded-lg pb-6 border border-gray-200'>
				<div className='flex items-center justify-between bg-gray-100 border border-gray-200 px-4 py-2 rounded-t-lg'>
					<p>Agent</p>
					<div className='flex items-center gap-2'>
						<Button
							onClick={handleEditClick}
							disabled={isUpdating}
							className='bg-background text-foreground text-xs font-medium hover:bg-background'>
							Edit
						</Button>
						<Button
							onClick={onChangeAgent}
							disabled={isUpdating}
							className='bg-background text-foreground text-xs font-medium hover:bg-background'>
							Change Agent
						</Button>
					</div>
				</div>
				<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
					<div>
						<div className='flex gap-4 p-4 items-center'>
							<Blockies seed={selectedAgent.name} size={10} scale={4} className='rounded-full' />
							<div className='flex items-start gap-2 w-full flex-col lg:flex-row lg:items-center'>
								<div>
									<p className='font-medium text-foreground'>{selectedAgent.name}</p>
								</div>
								<div className='flex items-center gap-2 text-gray-500 text-xs bg-gray-100 p-1 w-fit rounded-sm'>
									<Cpu width={15} />
									<p>{selectedAgentModel.name}</p>
								</div>
							</div>
							<CollapsibleTrigger className='border border-gray-200 p-2 rounded-lg h-fit'>
								{isExpanded ? (
									<ChevronUp width={15} height={15} />
								) : (
									<ChevronDown width={15} height={15} />
								)}
							</CollapsibleTrigger>
						</div>
						<CollapsibleContent>
							<div className='px-4'>
								<div>
									<div className='p-2 flex flex-col gap-1'>
										<p className='text-xs text-gray-500'>Role</p>
										<p>{selectedAgent.role}</p>
									</div>
									<div className='p-2 flex flex-col gap-1 border-b border-gray-200'>
										<p className='text-xs text-gray-500'>Goal</p>
										<p>{selectedAgent.goal}</p>
									</div>
									<div className='p-2 flex flex-col gap-1'>
										<p className='text-xs text-gray-500'>Backstory</p>
										<p>{selectedAgent.backstory}</p>
									</div>
								</div>
								<div className='flex gap-6 flex-col lg:flex-row'>
									<div className='flex flex-col gap-2 px-4 py-2 border border-gray-300 w-full rounded-lg'>
										<div className='flex items-center gap-2'>
											<Wrench width={15} color='#9CA3AF' />
											<p className='text-sm'>Tools</p>
										</div>
										<div className='flex flex-col gap-2'>
											{tools.map(tool => (
												<div
													key={tool._id.toString()}
													className='flex items-center gap-2 bg-gray-100 p-1 rounded'>
													<Wrench width={15} color='#9CA3AF' />
													<p className='line-clamp-1 text-sm'>{tool.name}</p>
												</div>
											))}
										</div>
									</div>

									<div className='flex flex-col gap-2 px-4 py-2 border border-gray-300 w-full rounded-lg'>
										<div className='flex items-center gap-2'>
											<Wrench width={15} color='#9CA3AF' />
											<p className='text-sm'>Data Sources</p>
										</div>
										<div className='flex flex-col gap-2'>
											{datasources.map(datasource => (
												<div
													className='flex items-center gap-2 bg-gray-100 p-1 rounded'
													key={datasource._id.toString()}>
													<File width={15} color='#2F2A89' />
													<p className='line-clamp-1 text-sm'>{datasource.name}</p>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>
				<CreateAgentSheet
					selectedAgentTools={selectedAgentTools}
					selectedAgent={selectedAgent}
					openEditSheet={openEditSheet}
					setOpenEditSheet={setOpenEditSheet}
					editing={true}
					agentId={selectedAgent?._id.toString()}
					callback={handleAgentEdit}
				/>
			</div>
		);
	},
	(prevProps, nextProps) => {
		// More accurate memo comparison
		if (prevProps.isUpdating || nextProps.isUpdating) return false;
		if (prevProps.openEditSheet !== nextProps.openEditSheet) return false;

		const agentChanged =
			JSON.stringify(prevProps.selectedAgent) !== JSON.stringify(nextProps.selectedAgent);
		const toolsChanged =
			JSON.stringify(prevProps.selectedAgentTools) !== JSON.stringify(nextProps.selectedAgentTools);
		const modelChanged = prevProps.selectedAgentModel?.name !== nextProps.selectedAgentModel?.name;

		return !agentChanged && !toolsChanged && !modelChanged;
	}
);

AgentCreatedDisplay.displayName = 'AgentCreatedDisplay';
