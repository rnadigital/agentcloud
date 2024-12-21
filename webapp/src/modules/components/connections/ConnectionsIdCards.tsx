import { formatDuration } from 'airbyte/format-duration';
import dayjs from 'dayjs';
import { Bolt, Box, ChevronDown, Clock, Loader, MoveRight, RefreshCcw } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from 'modules/components/ui/card';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from 'modules/components/ui/collapsible';
import { useRouter } from 'next/router';
import { Fragment, useState } from 'react';
import { useConnectionsStore } from 'store/connections';
import { useShallow } from 'zustand/react/shallow';

import Schedule from './Schedule';
import { Streams } from './Streams';

export const ConnectionsIdCards = () => {
	const [collapsibleStates, setCollapsibleStates] = useState({
		stream: false,
		jobHistory: false,
		settings: false
	});

	const { jobsList, datasource, syncDatasource, syncing } = useConnectionsStore(
		useShallow(state => ({
			jobsList: state.jobsList,
			datasource: state.datasource,
			syncDatasource: state.syncDatasource,
			syncing: state.syncing
		}))
	);

	const router = useRouter();

	return (
		<Fragment>
			<div className='flex flex-col gap-4 mb-4'>
				<div className='flex items-center justify-between'>
					<h3 className='font-semibold leading-6'>{datasource?.name}</h3>
					<Button
						className='flex rounded-lg gap-1 bg-[#5047dc] cursor-pointer px-2 py-1'
						onClick={async () => {
							await syncDatasource(datasource?._id.toString(), router);
						}}
					>
						{syncing[datasource?._id.toString()] ? (
							<div className='flex items-center gap-2'>
								<Loader className='animate-spin' width={15} />
								<p className='text-xs'>Syncing</p>
							</div>
						) : (
							<div className='flex items-center gap-2'>
								<RefreshCcw width={15} />
								<p className='text-xs'>Sync</p>
							</div>
						)}
					</Button>
				</div>
				<div className='flex justify-between items-center'>
					<article className='flex justify-between gap-2 items-center'>
						<div className='flex justify-between gap-2 items-center'>
							<Bolt width={15} />
							<p className='text-sm'>{datasource?.name}</p>
						</div>
						<MoveRight width={15} />
						<div className='flex justify-between gap-2 items-center'>
							<Box width={15} />
							<p className='text-sm'>AC Vector DB</p>
						</div>
					</article>
				</div>
				<article className='text-xs flex justify-between gap-2 items-center'>
					<div className='rounded bg-purple-100 text-purple-700 px-2 font-semibold flex items-center gap-1'>
						<Loader className='animate-spin' width={10} />
						<p>Embedding</p>
					</div>
					<div className='flex justify-between gap-2 items-center'>
						<div className='flex items-center gap-2 text-gray-400 bg-gray-100 px-2 py-1 rounded-sm'>
							<Clock width={15} />

							<p>
								{datasource?.lastSyncedDate
									? dayjs(datasource.lastSyncedDate).format('MMM D, YYYY h:mm A')
									: 'Never synced'}
							</p>
						</div>
					</div>
				</article>
			</div>
			<div className='flex flex-col gap-4'>
				<Collapsible
					open={collapsibleStates.stream}
					onOpenChange={open => {
						setCollapsibleStates(prevStates => {
							const updatedStates = Object.keys(prevStates).reduce(
								(acc, key) => {
									const typedKey = key as keyof typeof prevStates; // Explicitly type the key
									acc[typedKey] = typedKey === 'stream' ? open : false;
									return acc;
								},
								{} as typeof prevStates
							);
							return updatedStates;
						});
					}}
					className='border border-gray-200 rounded-lg'
				>
					<CollapsibleTrigger className='flex items-center justify-between gap-2 p-4 bg-gray-200 w-full rounded-t-lg'>
						<p>Stream</p>
						<ChevronDown />
					</CollapsibleTrigger>
					<CollapsibleContent className='p-4'>
						<Streams />
					</CollapsibleContent>
				</Collapsible>
				<Collapsible
					open={collapsibleStates.jobHistory}
					onOpenChange={open => {
						setCollapsibleStates(prevStates => {
							const updatedStates = Object.keys(prevStates).reduce(
								(acc, key) => {
									const typedKey = key as keyof typeof prevStates; // Explicitly type the key
									acc[typedKey] = typedKey === 'jobHistory' ? open : false;
									return acc;
								},
								{} as typeof prevStates
							);
							return updatedStates;
						});
					}}
					className='border border-gray-200 rounded-lg'
				>
					<CollapsibleTrigger className='flex items-center justify-between gap-2 p-4 bg-gray-200 w-full rounded-t-lg'>
						<p>Job History</p>
						<ChevronDown />
					</CollapsibleTrigger>
					<CollapsibleContent className='p-4'>
						<div className='flex flex-col gap-4'>
							{jobsList?.map((job, index) => (
								<Card key={index}>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<div
												className={`rounded-full w-4 h-4
                        ${
													job.status === 'Success'
														? 'bg-green-300'
														: job.status === 'Draft'
															? 'bg-gray-300'
															: job.status === 'Processing'
																? 'bg-yellow-300'
																: job.status === 'Embedding'
																	? 'bg-purple-300'
																	: 'bg-red-300'
												}`}
											></div>
											<p>{formatDuration(job.duration)}</p>
										</CardTitle>
										<CardDescription className='flex items-center gap-2 text-sm text-gray-500 font-medium'>
											<Clock width={15} />

											<p>{job.lastUpdatedAt}</p>
										</CardDescription>
									</CardHeader>
								</Card>
							))}
						</div>
					</CollapsibleContent>
				</Collapsible>
				<Collapsible
					open={collapsibleStates.settings}
					onOpenChange={open => {
						setCollapsibleStates(prevStates => {
							const updatedStates = Object.keys(prevStates).reduce(
								(acc, key) => {
									const typedKey = key as keyof typeof prevStates; // Explicitly type the key
									acc[typedKey] = typedKey === 'settings' ? open : false;
									return acc;
								},
								{} as typeof prevStates
							);
							return updatedStates;
						});
					}}
					className='border border-gray-200 rounded-lg'
				>
					<CollapsibleTrigger className='flex items-center justify-between gap-2 p-4 bg-gray-200 w-full rounded-t-lg'>
						<p>Settings</p>
						<ChevronDown />
					</CollapsibleTrigger>
					<CollapsibleContent className='p-4'>
						<Schedule />
					</CollapsibleContent>
				</Collapsible>
			</div>
		</Fragment>
	);
};
