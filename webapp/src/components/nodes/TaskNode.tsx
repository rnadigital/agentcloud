import { UserIcon, WrenchIcon } from '@heroicons/react/20/solid';
import { Handle, Position } from '@xyflow/react';
import { useFlowContext } from 'context/flow';
import { useCallback } from 'react';

const handleStyle = { left: 10 };

export default function TaskNode({ id, data, isConnectable }) {
	const { state, setKey }: any = useFlowContext();
	const nodeData = state[id] || {};
	const textValue = nodeData.text || '';
	const descriptionValue = nodeData.description || '';
	const expectedOutputValue = nodeData.expectedOutput || '';

	const onChange = useCallback((key) => (evt) => {
		const newValue = evt.target.value;
		setKey(id, { ...nodeData, [key]: newValue });
	}, [id, setKey, nodeData]);

	return (
		<div className='p-4 border rounded shadow-lg bg-white'>
			<Handle type='target' position={Position.Top} isConnectable={isConnectable} />
			<div>
				<label htmlFor={`text-${id}`} className='block text-sm font-medium text-gray-700'>
					Task
				</label>
				<input
					type='text'
					id={`text-${id}`}
					value={textValue}
					onChange={onChange('text')}
					placeholder='Enter text'
					className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
				/>
			</div>
			<div className='mt-4'>
				<label htmlFor={`description-${id}`} className='block text-sm font-medium text-gray-700'>
					Description
				</label>
				<textarea
					id={`description-${id}`}
					value={descriptionValue}
					onChange={onChange('description')}
					placeholder='Enter description'
					className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
				/>
			</div>
			<div className='mt-4'>
				<label htmlFor={`expected-output-${id}`} className='block text-sm font-medium text-gray-700'>
					Expected Output
				</label>
				<textarea
					id={`expected-output-${id}`}
					value={expectedOutputValue}
					onChange={onChange('expectedOutput')}
					placeholder='Enter expected output'
					className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
				/>
			</div>
			<div className='mt-4 flex space-x-4'>
				<div className='w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 cursor-pointer'>
					<UserIcon className='w-6 h-6 text-gray-600' />
				</div>
				<div className='w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 cursor-pointer'>
					<WrenchIcon className='w-6 h-6 text-gray-600' />
				</div>
			</div>
			<Handle
				type='source'
				position={Position.Bottom}
				id='a'
				style={handleStyle}
				isConnectable={isConnectable}
			/>
			<Handle type='source' position={Position.Bottom} id='b' isConnectable={isConnectable} />
		</div>
	);
}
1;
