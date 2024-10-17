import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import React from 'react';

const DataSourceGrid = () => {
	const createArrayFromInteger = (num: number): number[] => {
		return Array.from({ length: num }, (_, index) => index + 1);
	};

	const generatedArray = createArrayFromInteger(20); // Example usage

	return (
		<div className='flex flex-wrap'>
			<div className='border-gray-200 border grid place-items-center h-44 w-1/3 p-4 bg-gray-50'>
				<div className='w-full h-full bg-white border border-dashed border-gray-200 rounded-md flex justify-center items-center text-gray-500 flex-col text-sm'>
					<ArrowUpTrayIcon className='h-5 w-5' />
					<span>Drag files to upload</span>
					<div className='underline text-primary-500 underline-offset-4'> or browser for files</div>
				</div>
			</div>
			{generatedArray.map((item, index) => (
				<div key={index} className='border-gray-200 border grid place-items-center h-44 w-1/3'>
					{item}
				</div>
			))}
		</div>
	);
};

export default DataSourceGrid;
