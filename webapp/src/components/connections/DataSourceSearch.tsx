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
		<div className='flex items-center border border-input bg-background px-8 py-4 text-muted-foreground'>
			<MagnifyingGlassIcon className='h-4 w-4 mr-2' />
			<input
				type='text'
				placeholder='Search Data Source'
				className='flex-1 outline-none border-none bg-transparent text-foreground placeholder:text-muted-foreground'
				value={searchInput}
				onChange={e => setSearchInput(e.target.value)}
			/>
		</div>
	);
};

export default DataSourceSearch;
