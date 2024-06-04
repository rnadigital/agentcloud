import { Handle, Position } from '@xyflow/react';
import { useCallback } from 'react';

const handleStyle = { left: 10 };

export default function CustomNode({ data, isConnectable }) {
	const onChange = useCallback((evt) => {
		console.log(evt.target.value);
	}, []);

	return (
		<div className='task-node'>
			<Handle type='target' position={Position.Top} isConnectable={isConnectable} />
			<div>
				<label htmlFor='text'>Text:</label>
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

