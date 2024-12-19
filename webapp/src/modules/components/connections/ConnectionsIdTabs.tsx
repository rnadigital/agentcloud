import ButtonSpinner from 'components/ButtonSpinner';
import { StreamsList } from 'components/DatasourceStream';
import Spinner from 'components/Spinner';
import { jobHistoryData } from 'data/connections';
import { Bolt, Box, CircleCheck, Clock, Loader, MoveRight, RefreshCcw } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from 'modules/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'modules/components/ui/tabs';
import { Fragment } from 'react';

import { useConnections } from './ConnectionsContext';
import { Streams } from './Streams';

export const ConnectionsIdTabs = () => {
	const { datasource, airbyteState } = useConnections();

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
				<h3 className='font-semibold leading-6'>User Feedback</h3>
				<div className='flex justify-between items-center'>
					<article className='flex justify-between gap-2 items-center'>
						<div className='flex justify-between gap-2 items-center'>
							<Bolt width={15} />
							<p className='text-sm'>MySql</p>
						</div>
						<MoveRight width={15} />
						<div className='flex justify-between gap-2 items-center'>
							<Box width={15} />
							<p className='text-sm'>AC Vector DB</p>
						</div>
					</article>
					<article className='text-xs flex justify-between gap-2 items-center'>
						<div className='rounded bg-purple-100 text-purple-700 px-2 font-semibold flex items-center gap-1'>
							<Loader className='animate-spin' width={10} />
							<p>Embedding</p>
						</div>
						<div className='flex justify-between gap-2 items-center'>
							<div className='flex items-center gap-2 text-gray-400 bg-gray-100 px-2 py-1 rounded-sm'>
								<Clock width={15} />
								<p>Oct 16, 6:30 AM</p>
							</div>
							<Button
								asChild
								className='flex rounded-lg gap-1 bg-[#5047dc] cursor-pointer px-2 py-1'
							>
								<div className='flex items-center gap-2'>
									<RefreshCcw width={15} />
									<p className='text-xs'>Sync</p>
								</div>
							</Button>
						</div>
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
								{jobHistoryData &&
									jobHistoryData.map((job, index) => (
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
													<p>{job.duration}</p>
												</div>
											</TableCell>
											<TableCell className='p-5 text-xs flex items-center justify-end'>
												<div className='bg-gray-100 w-fit px-2 py-1 rounded text-gray-500 flex items-center gap-1'>
													<Clock width={15} />
													<p>{job.last_updated}</p>
												</div>
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
					</div>
				</TabsContent>
				<TabsContent value='settings'></TabsContent>
			</Tabs>
		</Fragment>
	);
};
