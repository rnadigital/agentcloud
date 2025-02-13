import { CirclePlus, Database, Search, Wrench } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from 'modules/components/ui/card';
import { Input } from 'modules/components/ui/input';
import React from 'react';
import { useAgentStore } from 'store/agent';
import { Agent } from 'struct/agent';
import { ToolType } from 'struct/tool';

export const AgentSelectDisplay = ({
	agentChoices,
	toolChoices,
	setSelectedAgent,
	setOpenEditSheet
}: {
	agentChoices: Agent[];
	toolChoices: any[];
	setSelectedAgent: React.Dispatch<React.SetStateAction<Agent>>;
	setOpenEditSheet: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	return (
		<div className='rounded-lg pn-6 border border-gray-200 bg-white'>
			<div className='flex flex-col gap-2 items-center rounded-t-lg p-6 gap-4 bg-gray-100'>
				<div className='flex flex-col gap-2 items-center'>
					<p className='font-medium'>Select Agent</p>
					<p className='text-gray-500'>
						Think of it as a virtual helper that manages important chats and replies in your app.
					</p>
				</div>
				<div className='w-full flex items-center justify-center gap-2 flex-col lg:flex-row'>
					<div className='order-2 lg:order-1 w-full lg:w-fit flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-1'>
						<Search width={15} color='#6B7280' />
						<Input
							placeholder='Search Agent'
							className='w-[100px] border-0 bg-transparent ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 p-0 h-auto shadow-none'
						/>
					</div>
					<Button
						asChild
						className='order-1 lg:order-2 bg-background border border-gray-300 hover:bg-background text-foreground'
						onClick={() => setOpenEditSheet(true)}
					>
						<div className='w-full lg:w-fit text-xs font-medium flex items-center gap-2 cursor-pointer'>
							<CirclePlus width={15} color='#6B7280' />
							<p>New Agent</p>
						</div>
					</Button>
				</div>
			</div>
			<div className='gap-4 p-4 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2'>
				{agentChoices?.map(agent => {
					const agentTools = toolChoices.filter(tool =>
						agent.toolIds.includes(tool._id.toString())
					);

					return (
						<Card
							key={agent._id.toString()}
							className='w-full rounded-2xl py-2 px-4 gap-[21px] flex flex-col border-0 shadow-none lg:border lg:border-gray-200'
						>
							<CardHeader>
								<CardTitle>
									<div className='flex flex-col gap-2'>
										<img src='/apps/identicon.png' className='w-12 h-12 rounded-full' />
										<p>{agent.name}</p>
									</div>
								</CardTitle>
								<CardDescription>{agent.role}</CardDescription>
							</CardHeader>
							<CardContent className='h-full overflow-auto max-h-[100px]'>
								{agentTools?.map(tools => {
									return (
										<div
											key={tools.id}
											className='bg-background flex items-center gap-1 py-1 px-2 rounded text-sm text-gray-500 font-medium'
										>
											{tools.type === ToolType.RAG_TOOL ? (
												<Database width={15} color='#9CA3AF' />
											) : (
												<Wrench width={15} color='#9CA3AF' />
											)}
											<p className='w-full'>{tools.name}</p>
										</div>
									);
								})}
							</CardContent>
							<CardFooter>
								<Button
									onClick={() => setSelectedAgent(agent)}
									asChild
									className='w-full cursor-pointer bg-background border border-gray-300 mt-2 hover:bg-background text-foreground'
								>
									<p>Select</p>
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		</div>
	);
};
