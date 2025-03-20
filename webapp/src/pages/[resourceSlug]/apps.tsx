import * as API from '@api';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { CreateAgentSheet } from 'components/apps/CreateAgentSheet';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { AppsDataReturnType } from 'controllers/app';
import { CirclePlus, LinkIcon, Search, TriangleAlert, ZapIcon, Ellipsis } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from 'modules/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from 'modules/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import { Input } from 'modules/components/ui/input';
import { ObjectId } from 'mongoose';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
import { useAgentStore } from 'store/agent';
import { App, AppType } from 'struct/app';
import { SharingMode } from 'struct/sharing';
import { toast } from 'react-toastify';
import ChatAppForm2 from 'components/ChatAppForm2';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'modules/components/ui/sheet';

const DeleteDialog = ({
	openDeleteDialog,
	setOpenDeleteDialog,
	onDelete
}: {
	openDeleteDialog: boolean;
	setOpenDeleteDialog: React.Dispatch<React.SetStateAction<boolean>>;
	onDelete: () => void;
}) => {
	return (
		<Dialog
			open={openDeleteDialog}
			onOpenChange={open => {
				setOpenDeleteDialog(open);
				// Reset pointer events when dialog closes
				if (!open) {
					document.body.style.pointerEvents = 'auto';
				}
			}}>
			<DialogContent className='w-[95%] lg:w-fit rounded-lg'>
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
						<p>Are you sure you want to delete this app? This action cannot be undone.</p>
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className='flex items-center justify-center gap-6 mx-auto mt-4'>
					<Button
						variant='secondary'
						onClick={() => setOpenDeleteDialog(false)}
						className='bg-background text-foreground hover:bg-background'>
						Cancel
					</Button>
					<Button
						onClick={() => {
							onDelete();
							setOpenDeleteDialog(false);
						}}
						className='bg-red-700 text-white hover:bg-red-800'>
						Delete app
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default function Apps(props) {
	const { agents } = useAgentStore();
	const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
	const [agentDisplay, setAgentDisplay] = useState<boolean>(false);
	const [openEditSheet, setOpenEditSheet] = useState<boolean>(false);
	const [filteredApps, setFilteredApps] = useState<App[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>();

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { teamName, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<AppsDataReturnType>(props);
	const [error, setError] = useState();
	const { apps } = state;

	const [selectedAgentId, setSelectedAgentId] = useState<string>(null);

	const appsToDisplay = filteredApps.length > 0 ? filteredApps : apps;

	async function startSession(appId: ObjectId) {
		await API.addSession(
			{
				_csrf: csrf,
				resourceSlug,
				id: appId
			},
			null,
			setError,
			router
		);
	}

	async function fetchApps() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	async function deleteApp(appId) {
		if (!appId) return;

		await API.deleteApp(
			{
				_csrf: csrf,
				resourceSlug,
				appId
			},
			() => {
				fetchApps();
				toast.success('App deleted successfully');
				setSelectedAgentId(null);
			},
			error => {
				toast.error(error || 'Error deleting app');
				setSelectedAgentId(null);
			},
			router
		);
	}

	useEffect(() => {
		fetchApps();
		refreshAccountContext();
	}, [resourceSlug]);

	useEffect(() => {
		setFilteredApps(
			searchTerm
				? apps?.filter(app => app?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
				: []
		);
	}, [searchTerm]);

	// Add cleanup effect
	useEffect(() => {
		// Cleanup function to reset pointer events when component unmounts
		return () => {
			document.body.style.pointerEvents = 'auto';
		};
	}, []);

	// Add handler for opening edit sheet
	const handleEditApp = (app: App) => {
		router.push(`/${resourceSlug}/app/${app._id}/edit`);
	};

	if (!apps) {
		return <Spinner />;
	}

	return (
		<>
			<DeleteDialog
				openDeleteDialog={openDeleteDialog}
				setOpenDeleteDialog={setOpenDeleteDialog}
				onDelete={() => deleteApp(selectedAgentId)}
			/>
			<main className='text-foreground flex flex-col gap-2'>
				<section className='flex items-center justify-between mb-4'>
					<h4 className='text-gray-900 font-semibold text-2xl'>Apps</h4>
					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-1'>
							<Search width={16} />
							<Input
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								placeholder='Search App'
								className='border-0 focus-visible:ring-offset-0 focus-visible:ring-0'
							/>
						</div>

						<Link
							href={`/${resourceSlug}/app/add`}
							className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg cursor-pointer'>
							<CirclePlus width={14} />
							<p className='font-semibold text-sm'>New App</p>
						</Link>
					</div>
				</section>
				{agents.length <= 0 ? (
					<CreateAgentSheet
						// setAgentDisplay={setAgentDisplay}
						openEditSheet={openEditSheet}
						setOpenEditSheet={setOpenEditSheet}
					/>
				) : (
					<section className='gap-4 grid grid-cols-1 lg:grid-cols-4 md:grid-cols-3'>
						{appsToDisplay?.map(app => {
							return (
								<Card
									key={app._id.toString()}
									className='rounded-2xl gap-[21px] flex flex-col border-0 shadow-none md:border lg:border-gray-100'>
									<CardHeader className='p-4'>
										<CardTitle>
											<div className='flex flex-col gap-2'>
												<div className='flex items-center justify-between'>
													<div className='relative'>
														<Blockies seed={app?.name} size={12} className='rounded-lg' />
														<div className='absolute -bottom-3 -right-3 bg-white rounded-full p-1'>
															{app.type === 'chat' ? (
																<ChatBubbleLeftRightIcon width={20} className='text-gray-800' />
															) : (
																<Image src='/process.svg' width={15} height={15} alt='user' />
															)}
														</div>
													</div>
													<div className='flex flex-col place-items-end'>
														<DropdownMenu>
															<DropdownMenuTrigger>
																<Ellipsis />
															</DropdownMenuTrigger>
															<DropdownMenuContent align='end'>
																<DropdownMenuItem onClick={() => handleEditApp(app)}>
																	Edit
																</DropdownMenuItem>
																<DropdownMenuItem
																	className='text-red-600'
																	onClick={() => {
																		setSelectedAgentId(app._id.toString());
																		setOpenDeleteDialog(true);
																	}}>
																	Delete
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
														<div className='flex gap-2 items-center text-green-700'>
															<ZapIcon size={14} />
															<p className='text-sm font-medium'>Published</p>
														</div>
													</div>
												</div>
												<p className='mt-2'>{app.name}</p>
											</div>
										</CardTitle>
										<CardDescription>
											<p className='line-clamp-5'>{app.description}</p>
											<p className='mt-3'>- by {app.author}</p>
										</CardDescription>
									</CardHeader>
									<CardFooter className='flex items-center md:justify-between mt-auto gap-2'>
										{(app.sharingConfig.mode === SharingMode.PUBLIC ||
											app.sharingConfig.mode === SharingMode.PRIVATE) && (
											<Button variant='secondary'>
												<LinkIcon size={12} />
												<p className='text-sm font-medium bg-gray-50 rounded-lg px-2 py-1'>
													Public
												</p>
											</Button>
										)}
										<Button variant='outline' onClick={() => startSession(app._id as any)}>
											Play
										</Button>
									</CardFooter>
								</Card>
							);
						})}
					</section>
				)}
			</main>
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}: {
	req: any;
	res: any;
	query: any;
	resolvedUrl: string;
	locale: string;
	locales: string[];
	defaultLocale: string;
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
