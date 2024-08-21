'use strict';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useReducer, useState } from 'react';
import { SyncModes } from 'struct/datasource';

export function StreamRow({
	stream,
	existingStream,
	streamProperty,
	readonly,
	descriptionsMap,
}: {
	stream?: any;
	existingStream?: any;
	streamProperty?: any;
	readonly?: boolean;
	descriptionsMap?: any;
}) {
	const [isExpanded, setIsExpanded] = useState(existingStream != null && !readonly);

	const streamName = stream?.stream?.name || stream?.name;

	const initialCheckedChildren =
		stream?.stream?.jsonSchema &&
		Object.entries(stream.stream.jsonSchema.properties)
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
	const [checkedChildren, setCheckedChildren] = useReducer(
		handleCheckedChild,
		initialCheckedChildren
	);

	const [datasourceDescriptions, setDatasourceDescriptions] = useState(descriptionsMap || {});
	const [selectedSyncMode, setSelectedSyncMode] = useState(
		existingStream?.config?.syncMode || streamProperty?.syncModes[0]
	);

	return (
		<div className='border-b dark:text-gray-50'>
			<div className='flex items-center p-4'>
				{!readonly && (
					<div className='me-4'>
						<label className='switch'>
							<input
								onClick={() => {
									checkedChildren?.length === 0 && setIsExpanded(true);
									setCheckedChildren({
										array:
											checkedChildren?.length === 0
												? Object.keys(stream.stream.jsonSchema.properties)
												: []
									});
								}}
								type='checkbox'
								className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'
								name={stream?.stream?.name || stream?.name}
								checked={checkedChildren?.length > 0}
							/>
							<span className='slider round'></span>
						</label>
					</div>
				)}
				<div
					className='flex items-center cursor-pointer select-none'
					onClick={() => setIsExpanded(!isExpanded)}
				>
					<span>
						{isExpanded ? (
							<ChevronDownIcon className='h-4 w-4' />
						) : (
							<ChevronRightIcon className='h-4 w-4' />
						)}
					</span>
					<span className='ml-2'>{streamName}</span>
				</div>
			</div>
			{stream?.stream?.jsonSchema && (
				<div
					className={`p-4 bg-gray-100 dark:bg-slate-800 rounded ${isExpanded ? '' : 'hidden'} dark:text-white`}
				>
					<div className='mb-4'>
						<label
							htmlFor='syncMode'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300'
						>
							Sync Mode
						</label>
						<select
							id='syncMode'
							name='syncMode'
							className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							value={selectedSyncMode}
							onChange={e => setSelectedSyncMode(e.target.value)}
							disabled={readonly}
						>
							{SyncModes.map(mode => {
								const modeAvailable = streamProperty?.syncModes?.includes(mode);
								return (
									<option key={mode} value={mode} disabled={!modeAvailable}>
										{mode.replace(/_/g, ' ')}{' '}
										{!modeAvailable ? '(not supported by this connector)' : ''}
									</option>
								);
							})}
						</select>
					</div>
					<table className='w-full'>
						<thead>
							<tr>
								<th className='px-2 py-1 text-left w-1'></th>
								<th className='px-2 py-1 text-left'>Field Name</th>
								<th className='px-2 py-1 text-left'>Type</th>
								<th className='px-2 py-1 text-left'>Description</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(stream.stream.jsonSchema.properties).map(([key, value]) => (
								<tr key={key}>
									<td className='p-2'>
										<label className='switch'>
											<input
												onChange={() =>
													setCheckedChildren({
														name: key,
														parent: stream?.stream?.name || stream?.name
													})
												}
												type='checkbox'
												className='rounded border-gray-300 text-indigo-600 disabled:text-gray-600 focus:ring-indigo-600 disabled:ring-gray-600 dark:bg-slate-800 dark:ring-slate-600 mx-2'
												name={key}
												data-parent={stream?.stream?.name || stream?.name}
												disabled={readonly}
												defaultChecked={existingStream?.config?.selectedFields?.some(sf =>
													sf['fieldPath'].includes(key)
												)}
												checked={checkedChildren.includes(key)}
											/>
											<span className='slider round'></span>
										</label>
									</td>
									<td className='p-2 font-semibold'>{key}</td>
									<td className='p-2'>
										{Array.isArray(value['type'])
											? value['type'].filter(x => x !== 'null')
											: value['type']}
									</td>
									<td className='p-2'>
										<input
											type='text'
											name={key}
											id={`${key}_description`}
											disabled={readonly}
											data-checked={
												existingStream?.config?.selectedFields?.some(sf =>
													sf['fieldPath'].includes(key)
												) || checkedChildren.includes(key)
											}
											defaultValue={datasourceDescriptions[key]}
											className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
											placeholder='Enter description'
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

export function StreamsList({
	streams,
	existingStreams,
	streamProperties,
	readonly,
	descriptionsMap
}: {
	streams?: any;
	existingStreams?: any;
	streamProperties?: any;
	readonly?: boolean;
	descriptionsMap?: any;
}) {
	return (
		<div className='my-4'>
			{streams?.map((stream, index) => {
				const streamProperty = streamProperties.find(sp => sp?.streamName === stream?.stream?.name);
				return <StreamRow
					readonly={readonly}
					key={index}
					stream={stream}
					existingStream={existingStreams?.find(st => st.name === stream?.name)}
					streamProperty={streamProperty}
					descriptionsMap={descriptionsMap}
				/>
})}
		</div>
	);
}
