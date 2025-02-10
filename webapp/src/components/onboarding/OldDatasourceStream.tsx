'use strict';

import {
	ChevronDownIcon,
	ChevronRightIcon,
	InformationCircleIcon
} from '@heroicons/react/20/solid';
import InfoAlert from 'components/InfoAlert';
import ToolTip from 'components/shared/ToolTip';
import Link from 'next/link';
import { useEffect, useReducer, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { FieldDescriptionMap, StreamConfig, StreamConfigMap, SyncModes } from 'struct/datasource';
import SelectClassNames from 'styles/SelectClassNames';
import submittingReducer from 'utils/submittingreducer';

export function StreamRow({
	stream,
	streamProperty,
	readonly,
	setStreamReducer,
	streamState
}: {
	stream: any;
	streamProperty: any;
	readonly?: boolean;
	setStreamReducer: Function;
	streamState: StreamConfig;
}) {
	const [isExpanded, setIsExpanded] = useState(streamState?.checkedChildren != null && !readonly);
	const streamName = stream?.stream?.name || stream?.name;

	const { defaultCursorField, sourceDefinedPrimaryKey, sourceDefinedCursorField } =
		streamProperty || {};
	const containsNestedFields =
		sourceDefinedPrimaryKey?.length > 1 || defaultCursorField?.length > 1;
	const [cursorField, setCursorField] = useState(streamState?.cursorField || defaultCursorField); //Note: is an array for nested fields which we dont yet fully support
	const [primaryKey, setPrimaryKey] = useState(
		streamState?.primaryKey || sourceDefinedPrimaryKey?.flat() || []
	);
	const initialSyncMode =
		streamProperty?.syncModes.find(m => m?.includes('incremental')) || streamProperty?.syncModes[0];
	const [syncMode, setSyncMode] = useState(streamState?.syncMode || initialSyncMode);
	const canSelectCursors = syncMode && syncMode !== 'full_refresh_overwrite';
	const canSelectPrimaryKey = sourceDefinedCursorField === false && canSelectCursors;

	//descriptions map
	const initialDescriptionsMap =
		streamState?.descriptionsMap ||
		Object.entries(stream?.stream?.jsonSchema?.properties || {}).reduce(
			(acc: FieldDescriptionMap, curr: [string, any]) => {
				const [key, value] = curr;
				const fieldType = Array.isArray(value['type'])
					? value['type'].filter(x => x !== 'null')
					: value['type'];
				acc[key] = {
					type: fieldType,
					description: ''
				};
				return acc;
			},
			{} as FieldDescriptionMap
		);
	const [descriptionsMap, setDescriptionsMap]: [FieldDescriptionMap, Function] = useReducer(
		submittingReducer,
		initialDescriptionsMap || {}
	);

	//checked fields
	const [checkedChildren, setCheckedChildren] = useReducer(
		handleCheckedChild,
		streamState.checkedChildren || []
	);

	function handleCheckedChild(state, action) {
		if (action.array) {
			return action.array;
		}
		if (state.includes(action.name)) {
			return state.filter(s => s !== action.name);
		}
		return state.concat([action.name]);
	}

	useEffect(() => {
		setStreamReducer({
			[streamName]: {
				checkedChildren,
				primaryKey,
				syncMode,
				cursorField,
				descriptionsMap
			}
		});
	}, [checkedChildren, primaryKey, syncMode, cursorField, descriptionsMap]);

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
								name={streamName}
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
					className={`p-4 bg-gray-100 dark:bg-slate-800 rounded ${isExpanded ? '' : 'hidden'} dark:text-white space-y-2 flex flex-col`}
				>
					{sourceDefinedCursorField ? (
						<div>
							<InfoAlert
								textColor='black'
								className='col-span-full bg-blue-100 text-blue-900 p-4 text-sm rounded-md mt-2'
								message='Source defined cursor field'
							>
								The cursor field and primary key for this stream is source-defined and cannot be
								deselected.
							</InfoAlert>
						</div>
					) : (
						syncMode !== initialSyncMode && (
							<InfoAlert
								textColor='black'
								className='col-span-full bg-blue-100 text-blue-900 p-4 text-sm rounded-md mt-2'
								message={
									<>
										<strong>Warning:</strong> Different sync modes affect how data is transferred
										and stored. Make sure to choose the mode that best suits your needs.{' '}
										<Link
											className='text-blue-600'
											href={'https://docs.airbyte.com/using-airbyte/core-concepts/sync-modes/'}
											rel='noopener noreferrer'
											target='_blank'
										>
											Learn more about sync modes here
										</Link>
									</>
								}
							/>
						)
					)}
					<div>
						<label
							htmlFor='syncMode'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300'
						>
							Sync Mode
						</label>
						<select
							name={`${streamName}_syncMode`}
							className='capitalize mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							value={syncMode}
							data-parent={streamName}
							onChange={e => {
								const newMode = e.target.value;
								setSyncMode(newMode);
							}}
							disabled={readonly}
						>
							{SyncModes.map(mode => {
								const modeAvailable =
									mode === 'full_refresh_overwrite' || //Note: experimental, forcing to always allow full refresh
									streamProperty?.syncModes?.includes(mode);
								return (
									<option key={mode} value={mode} disabled={!modeAvailable}>
										{mode.replace(/_/g, ' ')}{' '}
										{!modeAvailable ? '(not supported by this connector)' : ''}
									</option>
								);
							})}
						</select>
						{containsNestedFields && (
							<InfoAlert
								textColor='black'
								className='col-span-full bg-yellow-100 text-yellow-900 p-4 text-sm rounded-md mt-2'
								message='Connector uses nested fields'
							>
								Cursor and primary key selection for nested fields is not yet supported.
							</InfoAlert>
						)}
					</div>
					{canSelectPrimaryKey && (
						<div>
							<label
								htmlFor='primaryKey'
								className='flex text-sm font-medium text-gray-700 dark:text-gray-300 py-1 space-x-1'
							>
								<span>Primary Key</span>
								<span>
									<ToolTip
										content='Select the primary key field, or choose multiple fields to form a compound primary key.'
										placement='top'
										arrow={true}
									>
										<InformationCircleIcon className='h-4 w-4' />
									</ToolTip>
								</span>
							</label>
							<Select
								isClearable
								isMultiple
								isDisabled={!canSelectPrimaryKey}
								primaryColor={'indigo'}
								classNames={SelectClassNames}
								value={
									primaryKey?.length > 0 ? primaryKey?.map(x => ({ label: x, value: x })) : null
								}
								onChange={(v: any) => {
									if (!v || v?.length === 0) {
										return setPrimaryKey([]);
									}
									setPrimaryKey(v.map(x => x.value));
								}}
								options={streamProperty?.propertyFields?.map(x => ({
									label: x.join('.'),
									value: x.join('.')
								}))}
							/>
						</div>
					)}
					<table className='w-full'>
						<thead>
							<tr>
								<th className='px-2 py-1 text-left w-1'></th>
								<th className='px-2 py-1 text-left'>Field Name</th>
								{canSelectCursors && <th className='px-2 py-1 text-left'>Cursor field</th>}
								<th className='px-2 py-1 text-left'>Type</th>
								<th className='px-2 py-1 text-left'>Description</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(stream.stream.jsonSchema.properties).map(([key, value]) => {
								const fieldType = Array.isArray(value['type'])
									? value['type'].filter(x => x !== 'null')
									: value['type'];
								return (
									<tr key={key}>
										<td className='p-2'>
											<label className='switch'>
												<input
													onChange={() =>
														setCheckedChildren({
															name: key,
															parent: streamName
														})
													}
													type='checkbox'
													className='rounded border-gray-300 text-indigo-600 disabled:text-gray-600 focus:ring-indigo-600 disabled:ring-gray-600 dark:bg-slate-800 dark:ring-slate-600 mx-2'
													name={key}
													data-parent={streamName}
													disabled={readonly || (cursorField.includes(key) && canSelectCursors)} //Disable unchecking the field if it's the cursor field
													defaultChecked={streamState?.checkedChildren?.includes(key)}
													checked={checkedChildren.includes(key)}
												/>
												<span className='slider round'></span>
											</label>
										</td>
										<td className='p-2 font-semibold'>{key}</td>
										{canSelectCursors && (
											<td className='p-2 font-semibold'>
												<input
													onChange={() => {
														setCursorField([key]);
														if (!checkedChildren.includes(key)) {
															// Make sure to check the field they selected for cursor field if it isn't already
															setCheckedChildren({
																name: key,
																parent: streamName
															});
														}
													}}
													type='radio'
													className='rounded border-gray-300 text-indigo-600 disabled:text-gray-600 focus:ring-indigo-600 disabled:ring-gray-600 dark:bg-slate-800 dark:ring-slate-600 mx-2'
													name={`${streamName}_cursor`}
													data-parent={streamName}
													disabled={sourceDefinedCursorField || readonly || !canSelectCursors}
													defaultChecked={streamState?.checkedChildren?.includes(key)}
													checked={cursorField.includes(key)}
													required={isExpanded && cursorField?.length === 0}
												/>
											</td>
										)}
										<td className='p-2'>{fieldType}</td>
										<td className='p-2'>
											<input
												onChange={e => {
													setDescriptionsMap({
														[e.target.name]: {
															description: e.target.value,
															type: fieldType
														}
													});
												}}
												type='text'
												name={key}
												disabled={readonly}
												defaultValue={descriptionsMap[key]?.description || ''}
												className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
												placeholder='Enter description'
											/>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

export function StreamsList({
	streams,
	streamProperties,
	readonly,
	streamState,
	setStreamReducer
}: {
	streams?: any;
	streamProperties?: any;
	readonly?: boolean;
	streamState?: StreamConfigMap;
	setStreamReducer?: Function;
}) {
	return (
		<div className='my-4'>
			{streams?.map((stream, index) => {
				const streamName = stream?.stream?.name;
				const streamProperty = streamProperties?.find(sp => sp?.streamName === streamName);
				const initialStreamState = streamState?.[streamName] || ({} as StreamConfig);
				return (
					<StreamRow
						readonly={readonly}
						key={index}
						stream={stream}
						streamProperty={streamProperty}
						streamState={initialStreamState}
						setStreamReducer={setStreamReducer}
					/>
				);
			})}
		</div>
	);
}
