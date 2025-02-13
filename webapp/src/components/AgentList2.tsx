import * as API from '@api';
import { useAccountContext } from 'context/account';
import { CirclePlus, Database, Ellipsis, Search, TriangleAlert, Wrench } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from 'modules/components/ui/dialog';
import { Input } from 'modules/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CreateAgentSheet } from './apps/CreateAgentSheet';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from 'modules/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from 'modules/components/ui/tooltip';
import { ToolType } from 'struct/tool';
import { NewAgentSheet } from './agents/NewAgentSheet';

const DeleteDialog = ({
	openDeleteDialog,
	setOpenDeleteDialog,
	onDelete
}: {
	openDeleteDialog: boolean;
	setOpenDeleteDialog: (open: boolean) => void;
	onDelete: () => void;
}) => {
	return (
		<Dialog
			open={openDeleteDialog}
			onOpenChange={open => {
				setOpenDeleteDialog(open);
				if (!open) {
					// Reset focus and state when dialog closes
					document.body.style.pointerEvents = 'auto';
				}
			}}
		>
			<DialogContent
				onPointerDownOutside={() => {
					setOpenDeleteDialog(false);
					document.body.style.pointerEvents = 'auto';
				}}
				onEscapeKeyDown={() => {
					setOpenDeleteDialog(false);
					document.body.style.pointerEvents = 'auto';
				}}
				className='w-[95%] lg:w-fit rounded-lg'
			>
				<DialogHeader>
					<DialogTitle className='flex flex-col gap-4 items-center'>
						<TriangleAlert
							width={50}
							height={50}
							color='#9B1C1C'
							className='bg-red-50 p-2 rounded-full'
						/>
						<p className='font-semibold text-red-800'>Are you sure?</p>
					</DialogTitle>
					<DialogDescription className='flex flex-col items-center text-center'>
						<p>
							This agent is linked to 2 publicly shared apps. Deleting it could cause those apps to
							stop working.
						</p>
						<p>Are you sure you want to proceed?</p>
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className='flex items-center justify-center gap-6 mx-auto mt-4'>
					<Button
						onClick={() => {
							setOpenDeleteDialog(false);
							document.body.style.pointerEvents = 'auto';
						}}
						className='bg-background text-foreground hover:bg-background'
					>
						Cancel
					</Button>
					<Button
						onClick={() => {
							onDelete();
							setOpenDeleteDialog(false);
							document.body.style.pointerEvents = 'auto';
						}}
						className='bg-red-700 text-white hover:bg-red-800'
					>
						Delete agent
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default function AgentList2({ agents, fetchAgents }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, permissions } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

	const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
	const [agentDisplay, setAgentDisplay] = useState<boolean>(false);
	const [openEditSheet, setOpenEditSheet] = useState<boolean>(false);
	const [openNewAgentSheet, setOpenNewAgentSheet] = useState<boolean>(false);
	const [filteredAgents, setFilteredAgents] = useState<any[]>([]);
	const [selectedAgentId, setSelectedAgentId] = useState<string>(null);

	const [searchTerm, setSearchTerm] = useState<string>();
	const agentsToDisplay = filteredAgents.length > 0 ? filteredAgents : agents;

	useEffect(() => {
		setFilteredAgents(
			searchTerm
				? agents?.filter(agent => agent.name.toLowerCase().includes(searchTerm.toLowerCase()))
				: []
		);
	}, [searchTerm]);

	async function deleteAgent(agentId) {
		if (!agentId) return;

		API.deleteAgent(
			{
				_csrf: csrf,
				resourceSlug,
				agentId
			},
			() => {
				fetchAgents();
				toast.success('Agent deleted successfully');
				setSelectedAgentId(null);
			},
			error => {
				toast.error(error || 'Error deleting agent');
				setSelectedAgentId(null);
			},
			router
		);
	}

	return (
		<>
			<DeleteDialog
				openDeleteDialog={openDeleteDialog}
				setOpenDeleteDialog={setOpenDeleteDialog}
				onDelete={() => deleteAgent(selectedAgentId)}
			/>
			<main className='text-foreground flex flex-col gap-2'>
				<section className='flex items-center justify-between mb-4'>
					<h4 className='text-gray-900 font-semibold text-2xl'>Agents</h4>
					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-4 py-1'>
							<Search width={10.5} />
							<Input
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								placeholder='Search Agent'
								className=' border-0 shadow-none focus-visible:ring-offset-0 focus-visible:ring-0 p-0 h-auto bg-transparent'
							/>
						</div>
						<Button
							onClick={() => setOpenNewAgentSheet(true)}
							asChild
							className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg cursor-pointer'
						>
							<div>
								<CirclePlus width={10.5} />
								<p className='font-semibold text-sm'>New Agent</p>
							</div>
						</Button>
					</div>
				</section>
				{agents.length <= 0 ? (
					<CreateAgentSheet
						//@ts-ignore
						setAgentDisplay={setAgentDisplay}
						openEditSheet={openEditSheet}
						setOpenEditSheet={setOpenEditSheet}
						callback={async () => {
							await fetchAgents();
							setOpenEditSheet(false);
						}}
					/>
				) : (
					<section className='gap-4 grid grid-cols-1 lg:grid-cols-4 md:grid-cols-3'>
						{agentsToDisplay.map(agent => {
							return (
								<Card
									key={agent.id}
									className='rounded-2xl gap-[21px] flex flex-col border-0 shadow-none lg:border lg:border-gray-200 max-h-80 overflow-auto'
								>
									<CardHeader>
										<CardTitle>
											<div className='flex flex-col gap-2'>
												<div className='flex items-center justify-between'>
													<img src='/apps/identicon.png' className='w-12 h-12 rounded-full' />
													<DropdownMenu>
														<DropdownMenuTrigger>
															<Ellipsis />
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end'>
															<DropdownMenuItem
																className='text-red-600'
																onClick={() => {
																	setSelectedAgentId(agent._id);
																	setOpenDeleteDialog(true);
																}}
															>
																Delete
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => alert('Pin action triggered')}>
																Pin
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
												<p>{agent.name}</p>
											</div>
										</CardTitle>
										<CardDescription>{agent.role}</CardDescription>
									</CardHeader>
									<CardContent className='h-fit'>
										<div className='h-full flex flex-col py-4 px-2 rounded-lg bg-gray-50 gap-[8px]'>
											{agent.tools
												?.filter(tool => tool.type === ToolType.RAG_TOOL)
												.map(tool => {
													return (
														<div className='bg-background flex items-center gap-1 py-1 px-2 rounded text-sm text-gray-500 font-medium'>
															<Database width={15} color='#9CA3AF' />
															<p className='w-full'>{tool.name}</p>
														</div>
													);
												})}
											{agent.tools
												?.filter(tool => tool.type !== ToolType.RAG_TOOL)
												.map(tool => {
													return (
														<div className='bg-background flex items-center gap-1 py-1 px-2 rounded text-sm text-gray-500 font-medium'>
															<Wrench width={15} color='#9CA3AF' />
															<p className='w-full'>{tool.name}</p>
														</div>
													);
												})}
										</div>
									</CardContent>
									{agent?.users?.length > 0 && (
										<CardFooter className='flex items-center justify-between'>
											<p>Used by</p>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger className='flex items-center'>
														{agent?.users
															?.slice(0, 2)
															.map(user => (
																<img
																	src='/apps/identicon.png'
																	width={20}
																	height={20}
																	key={user.id}
																/>
															))}
														{agent?.users?.length > 2 && (
															<div className='text-xs p-0.5 text-gray-500 border border-gray-300 flex items-center justify-center'>
																+{agent?.users?.length - 2}
															</div>
														)}
													</TooltipTrigger>
													<TooltipContent className='flex flex-col'>
														<p className='text-gray-300 mb-4 font-medium'>Agents used by</p>
														<ul className='flex flex-col gap-2'>
															{agent?.users?.map(user => (
																<li key={user.id} className='flex items-center gap-2'>
																	<img width={15} height={15} src='/apps/identicon.png' />
																	<p>{user.name}</p>
																</li>
															))}
														</ul>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</CardFooter>
									)}
								</Card>
							);
						})}
					</section>
				)}
			</main>

			<NewAgentSheet
				//@ts-ignore
				setAgentDisplay={setAgentDisplay}
				openEditSheet={openNewAgentSheet}
				setOpenEditSheet={setOpenNewAgentSheet}
				callback={async () => {
					await fetchAgents();
					setOpenNewAgentSheet(false);
				}}
			/>
		</>
	);
}
