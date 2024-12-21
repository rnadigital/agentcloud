import { formatDuration } from 'airbyte/format-duration';
import dayjs from 'dayjs';
import {
	Bolt,
	Box,
	Circle,
	CircleAlert,
	CircleCheck,
	Clock,
	Loader,
	MoveRight,
	RefreshCcw
} from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from 'modules/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'modules/components/ui/tabs';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import { useConnectionsStore } from 'store/connections';
import { DatasourceStatus } from 'struct/datasource';
import { useShallow } from 'zustand/react/shallow';

import Schedule from './Schedule';
import { Streams } from './Streams';

export const ConnectionsIdTabs = () => {
	const { jobsList, datasource, syncDatasource, syncing } = useConnectionsStore(
		useShallow(state => ({
			jobsList: state.jobsList,
			datasource: state.datasource,
			syncDatasource: state.syncDatasource,
			syncing: state.syncing
		}))
	);

	const router = useRouter();

	const columns = [
		{
			title: 'Job Id',
			align: 'text-left'
		},
		{
			title: 'Status',
			align: 'text-left'
		},
		{
			title: 'Duration',
			align: 'text-left'
		},
		{
			title: 'Last Updated',
			align: 'text-right'
		}
	];

	return (
		<Fragment>
			<section>
				<h3 className='font-semibold leading-6'>{datasource?.name}</h3>
				<div className='flex justify-between items-center'>
					<article className='flex justify-between gap-2 items-center'>
						<div className='flex justify-between gap-2 items-center'>
							<Bolt width={15} />
							<p className='text-sm'>{datasource?.sourceType}</p>
						</div>
						<MoveRight width={15} />
						<div className='flex justify-between gap-2 items-center'>
							<Box width={15} />
							<p className='text-sm'>{datasource?.vectordbtype}</p>
						</div>
					</article>
					<article className='text-xs flex justify-between gap-2 items-center'>
						{datasource && (
							<div
								className={`flex items-center gap-2 w-fit px-2 py-1 text-sm rounded ${
									datasource.status === DatasourceStatus.READY
										? 'bg-green-100 text-green-700'
										: datasource.status === DatasourceStatus.DRAFT
											? 'bg-gray-100 text-gray-700'
											: datasource.status === DatasourceStatus.PROCESSING
												? 'bg-yellow-100 text-yellow-700'
												: datasource.status === DatasourceStatus.EMBEDDING
													? 'bg-purple-100 text-purple-700'
													: 'bg-red-100 text-red-700'
								}`}
							>
								{datasource.status === DatasourceStatus.READY ? (
									<CircleCheck width={15} />
								) : datasource.status === DatasourceStatus.DRAFT ? (
									<Circle width={15} />
								) : datasource.status === DatasourceStatus.PROCESSING ? (
									<Loader className='animate-spin' width={15} />
								) : datasource.status === DatasourceStatus.EMBEDDING ? (
									<Loader className='animate-spin' width={15} />
								) : (
									<CircleAlert width={15} />
								)}
								<p className='font-medium'>{datasource.status}</p>
							</div>
						)}
						{datasource && (
							<div className='flex justify-between gap-2 items-center'>
								<div className='flex items-center gap-2 text-gray-400 bg-gray-100 px-2 py-1 rounded-sm'>
									<Clock width={15} />
									<p>
										{datasource.lastSyncedDate
											? dayjs(datasource.lastSyncedDate).format('MMM D, YYYY h:mm A')
											: 'Never synced'}
									</p>
								</div>
								<Button
									asChild
									className='flex rounded-lg gap-1 bg-[#5047dc] cursor-pointer px-2 py-1'
									onClick={async () => {
										await syncDatasource(datasource._id.toString(), router);
									}}
								>
									{syncing[datasource._id.toString()] ? (
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
						)}
					</article>
				</div>
			</section>
			<Tabs defaultValue='streams' className='mt-4'>
				<TabsList className='bg-transparent p-0'>
					<TabsTrigger className='w-fit text-gray-500' variant='underline' value='streams'>
						Streams
					</TabsTrigger>
					<TabsTrigger className='w-fit text-gray-500' variant='underline' value='jobhistory'>
						Job History
					</TabsTrigger>
					<TabsTrigger className='w-fit text-gray-500' variant='underline' value='settings'>
						Settings
					</TabsTrigger>
				</TabsList>
				<TabsContent value='streams'>
					<Streams />
				</TabsContent>
				<TabsContent value='jobhistory'>
					<div className='overflow-x-auto'>
						<Table className='min-w-full bg-white shadow rounded-lg mt-5'>
							<TableHeader>
								<TableRow className='bg-gray-50'>
									{columns.map((column, index) => (
										<TableCell
											className={`font-semibold p-5 uppercase text-gray-500 ${column.align} text-xs`}
											key={index}
										>
											{column.title}
										</TableCell>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{jobsList &&
									jobsList.map((job, index) => (
										<TableRow className='py-4 cursor-pointer' key={index}>
											<TableCell className='p-5 text-sm text-gray-900'>
												{job.jobId.toString().padStart(2, '0')}
											</TableCell>
											<TableCell className='p-5 text-xs'>
												<div className='bg-[#e2faed] text-[#00b37e] w-fit px-2 py-1 rounded text-gray-500 flex items-center gap-1'>
													<CircleCheck width={15} />
													<p>{job.status}</p>
												</div>
											</TableCell>
											<TableCell className='p-5 text-xs'>
												<div className='bg-gray-100 w-fit px-2 py-1 rounded text-gray-500 flex items-center gap-1'>
													<Clock width={15} />
													<p>{formatDuration(job.duration)}</p>
												</div>
											</TableCell>
											<TableCell className='p-5 text-xs flex items-center justify-end'>
												<div className='bg-gray-100 w-fit px-2 py-1 rounded text-gray-500 flex items-center gap-1'>
													<Clock width={15} />
													<p>{job.lastUpdatedAt}</p>
												</div>
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
					</div>
				</TabsContent>
				<TabsContent value='settings'>
					<Schedule />
				</TabsContent>
			</Tabs>
		</Fragment>
	);
};
