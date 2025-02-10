import Spinner from 'components/Spinner';
import dayjs from 'dayjs';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation.js';
import React from 'react';
import { Datasource, DatasourceStatus } from 'struct/datasource';

export const ConnectionsCards = ({ datasources }: { datasources?: Datasource[] }) => {
	const router = useRouter();

	if (!datasources) {
		return <Spinner />;
	}

	return (
		<div className='mt-10 rounded-lg flex flex-col gap-5'>
			{datasources.map(connection => {
				return (
					<div
						onClick={() => router.push(`/connections/${connection._id}`)}
						key={connection._id.toString()}
						className='border border-gray-300 p-6 flex items-center rounded-lg'
					>
						<div
							className={`rounded-full w-6 h-4
              ${
								connection.status === DatasourceStatus.READY
									? 'bg-green-300'
									: connection.status === DatasourceStatus.DRAFT
										? 'bg-gray-300'
										: connection.status === DatasourceStatus.PROCESSING
											? 'bg-yellow-300'
											: connection.status === DatasourceStatus.EMBEDDING
												? 'bg-purple-300'
												: 'bg-red-300'
							}`}
						></div>
						<div className='w-full mx-4'>
							<p className='font-medium'>{connection.name}</p>
							<div className='text-sm text-gray-500 flex justify-between'>
								<p>Vector Database</p>
								<p>{dayjs(connection.createdDate).format('MMM D, YYYY h:mm A')}</p>
							</div>
						</div>
						<ChevronRight width={25} />
					</div>
				);
			})}
		</div>
	);
};
