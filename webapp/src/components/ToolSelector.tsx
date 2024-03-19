import React from 'react';

const ToolSelector = ({ children, tools, toolState, setToolState }) => {
	const handleToolSelect = (tool) => {
		if (toolState.some(t => t.value === tool._id)) {
			setToolState(oldTs => oldTs.filter(t => t.value !== tool._id));
		} else {
			setToolState(oldTs => oldTs.concat([tool]));
		}
	};

	return (
		<div className='mt-2'>
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4'>
				{tools.map(tool => (
					<div
						key={tool._id}
						className={`tool-card flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-100 ${toolState.some(ts => ts.value === tool._id) ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'} transition-all`}
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
