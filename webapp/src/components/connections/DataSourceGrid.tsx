import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import React, { ReactNode, useMemo, useRef, useState } from 'react';
import { useDatasourceStore } from 'store/datasource';
import { Connector } from 'struct/connector';
import cn from 'utils/cn';
import { useShallow } from 'zustand/react/shallow';

import DataSourceCredentialsForm from './DataSourceCredentialsForm';

const DataSourceGrid = () => {
	const { connectors, searchInput, selectedConnector, setSelectedConnector } = useDatasourceStore(
		useShallow(state => ({
			connectors: state.connectors,
			searchInput: state.searchInput,
			selectedConnector: state.selectedConnector,
			setSelectedConnector: state.setSelectedConnector
		}))
	);

	const filteredConnectors: Connector[] = useMemo(() => {
		return Array.from(new Set(connectors.map(connector => connector.name.toLowerCase())))
			.map(name => connectors.find(connector => connector.name.toLowerCase() === name))
			.filter(connector => connector.name.toLowerCase().includes(searchInput?.toLowerCase() || ''));
	}, [connectors, searchInput]);

	const selectedConnectorIndex = filteredConnectors.findIndex(
		c => c.name === selectedConnector?.name
	);

	if (filteredConnectors.length === 0) {
		return (
			<div className='flex flex-wrap'>
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className='border-gray-200 border grid place-items-center h-44 w-1/3 p-4 bg-gray-50 animate-pulse'>
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
			<div className='border-gray-200 border grid place-items-center h-44 w-full md:w-1/2 lg:w-1/3 p-4 bg-gray-50'>
				<div className='w-full h-full bg-white border border-dashed border-gray-200 rounded-md flex justify-center items-center text-gray-500 flex-col text-sm'>
					<ArrowUpTrayIcon className='h-5 w-5' />
					<span>Drag files to upload</span>
					<div className='underline text-primary-500 underline-offset-4'> or browser for files</div>
				</div>
			</div>

			{filteredConnectors.map((connector, index) => (
				<React.Fragment key={connector.name}>
					<button
						className={cn(
							'flex flex-col justify-center items-center border-gray-200 border h-44 w-full md:w-1/2 lg:w-1/3 relative',
							{ 'bg-primary-50 border-0': selectedConnectorIndex === index }
						)}
						onClick={() => setSelectedConnector(connector)}>
						<img src={connector.icon} className='h-6 w-6 mb-2' />
						<span>{connector.name}</span>
					</button>
					{selectedConnectorIndex === index && (
						<DataSourceCredentialsForm connector={selectedConnector} />
					)}
				</React.Fragment>
			))}
		</div>
	);
};

export default DataSourceGrid;
