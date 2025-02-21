import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { useDatasourceStore } from 'store/datasource';
import { useShallow } from 'zustand/react/shallow';

const DataSourceSearch = () => {
	const { searchInput, setSearchInput } = useDatasourceStore(
		useShallow(state => ({
			searchInput: state.searchInput,
			setSearchInput: state.setSearchInput
		}))
	);

	return (
		<div className='flex items-center border border-gray-200 px-8 py-4 text-gray-500'>
			<MagnifyingGlassIcon className='h-4 w-4 mr-2' />
			<input
				type='text'
				placeholder='Search Data Source'
				className='flex-1 outline-none border-none'
				value={searchInput}
				onChange={e => setSearchInput(e.target.value)}
			/>
		</div>
	);
};

export default DataSourceSearch;
