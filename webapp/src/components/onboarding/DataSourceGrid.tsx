import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { Connector } from 'struct/connector';

const DataSourceGrid = ({ connectors }: { connectors: Connector[] }) => {
	if (connectors.length === 0) {
		return (
			<div className='flex flex-wrap'>
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className='border-gray-200 border grid place-items-center h-44 w-1/3 p-4 bg-gray-50 animate-pulse'
					>
						<div className='w-full h-full bg-gray-200 border border-dashed border-gray-300 rounded-md flex justify-center items-center text-gray-500 flex-col text-sm'>
							<div className='h-5 w-5 bg-gray-300 rounded-full mb-2' />
							<div className='h-4 w-3/4 bg-gray-300 rounded mb-1' />
							<div className='h-4 w-1/2 bg-gray-300 rounded' />
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className='flex flex-wrap'>
			<div className='border-gray-200 border grid place-items-center h-44 w-1/3 p-4 bg-gray-50'>
				<div className='w-full h-full bg-white border border-dashed border-gray-200 rounded-md flex justify-center items-center text-gray-500 flex-col text-sm'>
					<ArrowUpTrayIcon className='h-5 w-5' />
					<span>Drag files to upload</span>
					<div className='underline text-primary-500 underline-offset-4'> or browser for files</div>
				</div>
			</div>

			{connectors.map((connector, index) => (
				<button
					key={connector.name}
					className='border-gray-200 border flex flex-col justify-center items-center h-44 w-1/3'
				>
					<img src={connector.icon} className='h-6 w-6 mb-2' />
					<span>{connector.name}</span>
				</button>
			))}
		</div>
	);
};

export default DataSourceGrid;
