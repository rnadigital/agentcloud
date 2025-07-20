import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import cn from 'utils/cn';
import React, { ReactNode, useRef, useState } from 'react';
import { Connector } from 'struct/connector';

import DataSourceCredentialsForm from './DataSourceCredentialsForm';

const DataSourceGrid = ({
	connectors,
	setCurrentDatasourceStep
}: {
	connectors: Connector[];
	setCurrentDatasourceStep: Function;
}) => {
	const [selectedConnector, setSelectedConnector] = useState<Connector>();
	const selectedConnectorIndex = connectors.findIndex(c => c.name === selectedConnector?.name);

	const findIndexToDisplayForm = (index: number) => {
		if (index === -1) return null;
		return Math.floor((index + 1) / 3) * 3 + 1;
	};
	const indexToDisplayForm = findIndexToDisplayForm(selectedConnectorIndex);

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
		<div className='flex flex-wrap relative'>
			<div className='border-gray-200 border grid place-items-center h-44 w-1/3 p-4 bg-gray-50'>
				<div className='w-full h-full bg-white border border-dashed border-gray-200 rounded-md flex justify-center items-center text-gray-500 flex-col text-sm'>
					<ArrowUpTrayIcon className='h-5 w-5' />
					<span>Drag files to upload</span>
					<div className='underline text-primary-500 underline-offset-4'> or browser for files</div>
				</div>
			</div>

			{connectors.map((connector, index) => (
				<>
					<button
						key={connector.name}
						className={cn(
							'flex flex-col justify-center items-center border-gray-200 border  h-44 w-1/3 relative',
							{ 'bg-primary-50 border-0': selectedConnectorIndex === index }
						)}
						onClick={() => setSelectedConnector(connector)}
					>
						<img src={connector.icon} className='h-6 w-6 mb-2' />
						<span>{connector.name}</span>
					</button>
					{indexToDisplayForm === index && (
						<DataSourceCredentialsForm
							connector={selectedConnector}
							setStep={setCurrentDatasourceStep}
						/>
					)}
				</>
			))}
		</div>
	);
};

export default DataSourceGrid;
