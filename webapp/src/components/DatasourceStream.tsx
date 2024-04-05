'use strict';

import {
	ChevronDownIcon,
	ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useState, useReducer } from 'react';

export function StreamRow({ stream, existingStream, readonly }
	: { stream?: any, existingStream?: any, readonly?: boolean }) {
	const [isExpanded, setIsExpanded] = useState(existingStream != null && !readonly);

	const initialCheckedChildren = stream?.stream?.jsonSchema && Object.entries(stream.stream.jsonSchema.properties)
		.map(([key, value]) => {
			if (existingStream?.config?.selectedFields?.some(sf => sf['fieldPath'].includes(key))) {
				return key;
			}
		})
		.filter(x => x);

	function handleCheckedChild(state, action) {
		if (action.array) {
			return action.array;
		}
		if (state.includes(action.name)) {
			return state.filter(s => s !== action.name);
		}
		return state.concat([action.name]);
	}
	const [checkedChildren, setCheckedChildren] = useReducer(handleCheckedChild, initialCheckedChildren);

	return (
		<div className='border-b'>
			<div className='flex items-center p-4'>
				{!readonly && <div className='me-4'>
					<label className='switch'>
						<input
							onClick={() => {
								checkedChildren?.length === 0 && setIsExpanded(true);
								setCheckedChildren({
									array: checkedChildren?.length === 0 ? Object.keys(stream.stream.jsonSchema.properties) : [],
								});
							}}
							type='checkbox'
							className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'
							name={stream?.stream?.name || stream?.name}
							checked={checkedChildren?.length > 0}
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
			{stream?.stream?.jsonSchema && <div className={`p-4 bg-gray-100 rounded ${isExpanded ? '' : 'hidden'}`}>
				<div>Fields:</div>
				{Object.entries(stream.stream.jsonSchema.properties).map(([key, value]) => (
					<div key={key}>
						<label className='switch'>
							<input
								onChange={() => setCheckedChildren({
									name: key,
									parent: stream?.stream?.name || stream?.name,
								})}
								type='checkbox'
								className='rounded border-gray-300 text-indigo-600 disabled:text-gray-600 focus:ring-indigo-600 disabled:ring-gray-600 dark:bg-slate-800 dark:ring-slate-600 mx-2'
								name={key}
								data-parent={stream?.stream?.name || stream?.name}
								disabled={readonly}
								defaultChecked={existingStream?.config?.selectedFields?.some(sf => sf['fieldPath'].includes(key))}
								checked={checkedChildren.includes(key)}
							/>
							<span className='slider round'></span>
						</label>
						<span className='font-semibold'>{key}:</span> {value['type']}
					</div>
				))}
			</div>}
		</div>
	);
}

export function StreamsList({ streams, existingStreams, readonly }
	: { streams?: any, existingStreams?: any, readonly?: boolean }) {
	return (
		<div className='my-4'>
			{streams.map((stream, index) => (
				<StreamRow
					readonly={readonly}
					key={index}
					stream={stream}
					existingStream={existingStreams?.find(es => es.stream.name === stream?.stream?.name)}
				/>
			))}
		</div>
	);
}
