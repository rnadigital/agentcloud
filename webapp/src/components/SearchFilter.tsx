import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchFilter({ filter, setFilter }) {
	return (
		<div className='relative w-full mb-3'>
			<MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
			<input
				onChange={e => setFilter(e.target.value || '')}
				type='text'
				className='w-full pl-10 pr-3 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1'
				placeholder='Search'
			/>
		</div>
	);
}