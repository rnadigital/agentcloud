import React, { useState } from 'react';

const ToolSelector = ({ children, tools, toolState, setToolState }) => {
	const [searchTerm, setSearchTerm] = useState('');

	const handleToolSelect = (tool) => {
		if (toolState.some(t => t.value === tool._id)) {
			setToolState(oldTs => oldTs.filter(t => t.value !== tool._id));
		} else {
			setToolState(oldTs => oldTs.concat([tool]));
		}
	};

	const handleSearchChange = (event) => {
		setSearchTerm(event.target.value.toLowerCase());
	};

	const filteredTools = tools.filter(tool => tool.name.toLowerCase().includes(searchTerm));

	return (
		<div className='mt-2'>
			<div>
				<label htmlFor='search-tool' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
					Search Tools
				</label>
				<div className='mt-2'>
					<input
						id='search-tool'
						name='search-tool'
						type='text'
						placeholder='Type to filter tools...'
						autoComplete='off'
						value={searchTerm}
						onChange={handleSearchChange}
						className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						required
					/>
				</div>
			</div>
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4 overflow-y-auto' style={{ maxHeight: '500px' }}>
				{filteredTools.map(tool => (
					<div
						key={tool._id}
						className={`tool-card flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-100 ${toolState.some(ts => ts.value === tool._id) ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'} transition-all overflow-hidden break-all`}
						onClick={() => handleToolSelect({ value: tool._id, ...tool })}
					>
						<span className='text-gray-800 text-sm font-medium'>{tool.name}</span>
						<span className={`text-blue-500 ${!toolState.some(ts => ts.value === tool._id) && 'invisible'}`}>✓</span>
					</div>
				))}
			</div>
			{children}
		</div>
	);
};

export default ToolSelector;
