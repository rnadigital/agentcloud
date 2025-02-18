import ButtonSpinner from 'components/ButtonSpinner';
import Spinner from 'components/Spinner';
import dayjs from 'dayjs';
import { Circle, CircleAlert, CircleCheck, Clock, Loader, RefreshCcw, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from 'modules/components/ui/table';
import { useRouter } from 'next/router';
import { useConnectionsStore } from 'store/connection';
import { Datasource, DatasourceStatus } from 'struct/datasource';

export const ConnectionsTable = ({
	datasources,
	deleteDatasource,
	deleting
}: {
	datasources?: Datasource[];
	deleteDatasource: (datasourceId: string) => void;
	deleting: any;
}) => {
	const router = useRouter();

	const { resourceSlug } = router.query;

	const columns = ['Name', 'Source', 'Destination', 'Status', 'Sync', 'Actions'];

	const goToDatasourcePage = (id: string) => {
		router.push(`/${resourceSlug}/connections/${id}`);
	};

	if (!datasources) {
		return <Spinner />;
	}

	return (
		<Table className='min-w-full bg-white shadow border-2 mt-10 rounded-lg'>
			<TableHeader>
				<TableRow className='bg-gray-100'>
					{columns.map(name => (
						<TableCell className='font-semibold uppercase text-gray-500 p-5 text-xs' key={name}>
							{name}
						</TableCell>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{datasources.map((connection, index) => (
					<TableRow
						onClick={() => goToDatasourcePage(connection._id.toString())}
						className='py-4 cursor-pointer text-foreground'
						key={index}>
						<TableCell className='p-5'>
							<div>
								<p className='font-semibold'>{connection.name}</p>
								<span className='text-gray-500 text-xs'>
									{dayjs(connection.createdDate).format('MMM D, YYYY h:mm A')}
								</span>
							</div>
						</TableCell>
						<TableCell className='p-5 text-xs'>{connection.sourceType}</TableCell>
						<TableCell className='p-5 text-xs'>Vector database</TableCell>
						<TableCell className='p-5 text-xs'>
							<div
								className={`flex items-center gap-2 w-fit px-2 py-1 text-sm rounded ${
									connection.status === DatasourceStatus.READY
										? 'bg-green-100 text-green-700'
										: connection.status === DatasourceStatus.DRAFT
											? 'bg-gray-100 text-gray-700'
											: connection.status === DatasourceStatus.PROCESSING
												? 'bg-yellow-100 text-yellow-700'
												: connection.status === DatasourceStatus.EMBEDDING
													? 'bg-purple-100 text-purple-700'
													: 'bg-red-100 text-red-700'
								}`}>
								{connection.status === DatasourceStatus.READY ? (
									<CircleCheck width={15} />
								) : connection.status === DatasourceStatus.DRAFT ? (
									<Circle width={15} />
								) : connection.status === DatasourceStatus.PROCESSING ? (
									<Loader className='animate-spin' width={15} />
								) : connection.status === DatasourceStatus.EMBEDDING ? (
									<Loader className='animate-spin' width={15} />
								) : (
									<CircleAlert width={15} />
								)}
								<p className='font-medium'>{connection.status}</p>
							</div>
						</TableCell>
						<TableCell className='p-5 text-xs'>
							<div className='flex items-center gap-2'>
								<div className='flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-gray-500'>
									<Clock width={15} />
									<p>
										{connection.lastSyncedDate
											? dayjs(connection.lastSyncedDate).format('MMM D, YYYY h:mm A')
											: 'N/A'}
									</p>
								</div>
								<button className='ml-auto flex items-center gap-2 px-2.5 py-0.5 text-white bg-[#4F46E5] rounded-md'>
									<RefreshCcw width={15} />
									<p>Sync</p>
								</button>
							</div>
						</TableCell>
						<TableCell className='p-5 text-xs'>
							{deleting[connection._id.toString()] ? (
								<ButtonSpinner size={25} />
							) : (
								<Trash2
									width={25}
									className='border border-gray-200 rounded px-1 py-0.5'
									color='#9CA3AF'
									onClick={e => {
										e.stopPropagation();
										deleteDatasource(connection._id.toString());
									}}
								/>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
