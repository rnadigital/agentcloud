import { Model } from 'db/model';
import { Box, ChevronDown, ChevronUp, Cpu, File, Wrench } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from 'modules/components/ui/collapsible';
import React, { useState } from 'react';
import Blockies from 'react-blockies';
import { useAgentStore } from 'store/agent';
import { Agent } from 'struct/agent';
import { Tool, ToolType } from 'struct/tool';

export const AgentCreatedDisplay = ({
	setSelectedAgent,
	setOpenEditSheet,
	selectedAgent,
	selectedAgentModel,
	selectedAgentTools
}: {
	setSelectedAgent: React.Dispatch<React.SetStateAction<Agent>>;
	setOpenEditSheet: React.Dispatch<React.SetStateAction<boolean>>;
	selectedAgent: Agent;
	selectedAgentModel: Model;
	selectedAgentTools: Tool[];
}) => {
	const [agentDetailsCollapsed, setAgentDetailsCollapsed] = useState<boolean>(true);
	const datasources = selectedAgentTools.filter(tool => tool.type === ToolType.RAG_TOOL);
	const tools = selectedAgentTools.filter(tool => tool.type !== ToolType.RAG_TOOL);

	return (
		<div className='flex flex-col gap-4 rounded-lg pb-6 border border-gray-200'>
			<div className='flex items-center justify-between bg-gray-100 border border-gray-200 px-4 py-2 rounded-t-lg'>
				<p>Agent</p>
				<div className='flex items-center gap-2'>
					<Button
						onClick={() => {
							setOpenEditSheet(true);
						}}
						className='bg-background text-foreground text-xs font-medium hover:bg-background'
					>
						Edit
					</Button>
					<Button
						onClick={() => setSelectedAgent(null)}
						className='bg-background text-foreground text-xs font-medium hover:bg-background'
					>
						Change Agent
					</Button>
					{/* <Popover>
            <PopoverTrigger>
              <Button className="bg-background text-foreground text-xs font-medium hover:bg-background">
                Change Agent
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Command>
                <CommandInput placeholder="Search agent..." />
                <CommandList>
                  <CommandEmpty>No agent found.</CommandEmpty>
                  <CommandGroup>
                    {agents.map((agent) => (
                      <CommandItem key={agent.id} value={agent.name}>
                        {agent.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover> */}
				</div>
			</div>
			<Collapsible open={agentDetailsCollapsed} onOpenChange={setAgentDetailsCollapsed}>
				<div>
					<div className='flex gap-4 p-4 items-center'>
						<Blockies seed={selectedAgent.name} size={10} scale={4} className='rounded-full' />
						<div className='flex items-start gap-2 w-full flex-col lg:flex-row lg:items-center'>
							<div>
								<p className='font-medium text-foreground'>{selectedAgent.name}</p>
								{/* <p className='text-xs text-gray-500 font-semibold'>Technical Support</p> */}
							</div>
							<div className='flex items-center gap-2 text-gray-500 text-xs bg-gray-100 p-1 w-fit rounded-sm'>
								<Cpu width={15} />
								<p>{selectedAgentModel.name}</p>
							</div>
						</div>
						<CollapsibleTrigger className='border border-gray-200 p-2 rounded-lg h-fit'>
							{agentDetailsCollapsed ? (
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
												className='flex items-center gap-2 bg-gray-100 p-1 rounded'
											>
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
												key={datasource._id.toString()}
											>
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
		</div>
	);
};
