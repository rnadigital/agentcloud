'use strict';

import {
	ChevronDownIcon,
	ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export function StreamRow({ stream, checked, readonly }) {
	const [isExpanded, setIsExpanded] = useState(false);
	return (
		<div className='border-b'>
			<div className='flex items-center p-4'>
				{!readonly && <div className='me-4'>
					<label className='switch'>
						<input
							type='checkbox'
							className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'
							name={stream?.stream?.name || stream?.name}
							defaultChecked={checked}
						/>
						<span className='slider round'></span>
					</label>
				</div>}
				<div className='flex items-center cursor-pointer select-none' onClick={() => setIsExpanded(!isExpanded)}>
					<span>
						{isExpanded ? <ChevronDownIcon className='h-4 w-4' /> : <ChevronRightIcon className='h-4 w-4' />}
					</span>
					<span className='ml-2'>{stream?.stream?.name || stream?.name}</span>
				</div>
			</div>
			{isExpanded && stream?.stream &&  (
				<div className='p-4 bg-gray-100 rounded'>
					<div>Schema:</div>
					{Object.entries(stream.stream.jsonSchema.properties).map(([key, value]) => (
						<div key={key} className='ml-4'>
							<span className='font-semibold'>{key}:</span> {value['type']}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function StreamsList({ streams, existingStreams, readonly }) {
	return (
		<div className='my-4'>
			{streams.map((stream, index) => (
				<StreamRow
					readonly={readonly}
					key={index}
					stream={stream}
					checked={existingStreams && existingStreams.includes(stream?.stream?.name || stream?.name)}
				/>
			))}
		</div>
	);
}
