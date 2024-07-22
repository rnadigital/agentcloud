import ButtonSpinner from 'components/ButtonSpinner';
import React from 'react';
import { ToolState } from 'struct/tool';

const toolStateColors = {
	[ToolState.PENDING]: 'bg-blue-200 text-blue-800  border-blue-800',
	[ToolState.READY]: 'bg-green-200 text-green-800 border-green-800',
	[ToolState.ERROR]: 'bg-red-200 text-red-800 border-red-800'
};

export default function ToolStateBadge({ state }) {
	return (
		<span
			className={`capitalize px-1.5 py-[0.5px] border text-sm rounded-lg ${toolStateColors[state]}`}
		>
			{state === ToolState.PENDING && (
				<ButtonSpinner size={12} className='my-0.5 -me-1 !text-blue-800' />
			)}
			{state}
		</span>
	);
}
