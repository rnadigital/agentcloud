'use strict';

import {
	ChevronDownIcon,
	ChevronRightIcon,
	InformationCircleIcon,
	CheckIcon,
	ChevronUpIcon
} from '@heroicons/react/20/solid';
import InfoAlert from 'components/InfoAlert';
import ToolTip from 'components/shared/ToolTip';
import Link from 'next/link';
import { useEffect, useReducer, useState } from 'react';
import { useDatasourceStore } from 'store/datasource';
import { FieldDescriptionMap, StreamConfig, StreamConfigMap, SyncModes } from 'struct/datasource';
import submittingReducer from 'utils/submittingreducer';
import { useShallow } from 'zustand/react/shallow';
import cn from 'utils/cn';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';

export function StreamRow({
	stream,
	streamProperty,
	readonly,
	streamState
}: {
	stream: any;
	streamProperty: any;
	readonly?: boolean;
	streamState: StreamConfig;
}) {
	const setStreamState = useDatasourceStore(state => state.setStreamState);

	const [isExpanded, setIsExpanded] = useState(streamState?.checkedChildren != null && !readonly);
	const streamName = stream?.stream?.name || stream?.name;

	const { defaultCursorField, sourceDefinedPrimaryKey, sourceDefinedCursorField } =
		streamProperty || {};
	const containsNestedFields =
		sourceDefinedPrimaryKey?.length > 1 || defaultCursorField?.length > 1;
	const [cursorField, setCursorField] = useState(streamState?.cursorField || defaultCursorField);
	const [primaryKey, setPrimaryKey] = useState(
		streamState?.primaryKey || sourceDefinedPrimaryKey?.flat() || []
	);
	const initialSyncMode =
		streamProperty?.syncModes.find(m => m?.includes('incremental')) || streamProperty?.syncModes[0];
	const [syncMode, setSyncMode] = useState(streamState?.syncMode || initialSyncMode);
	const canSelectCursors = syncMode && syncMode !== 'full_refresh_overwrite';
	const canSelectPrimaryKey = sourceDefinedCursorField === false && canSelectCursors;

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
		setStreamState({
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
		<div className='border-b border-border'>
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
								className='rounded border-input text-primary focus:ring-primary bg-background'
								name={streamName}
								checked={checkedChildren?.length > 0}
							/>
							<span className='slider round'></span>
						</label>
					</div>
				)}
				<div
					className='flex items-center cursor-pointer select-none text-foreground'
					onClick={() => setIsExpanded(!isExpanded)}>
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
					className={cn(
						'p-4 bg-muted rounded space-y-2 flex flex-col',
						isExpanded ? '' : 'hidden'
					)}>
					{sourceDefinedCursorField ? (
						<div>
							<InfoAlert
								textColor='black'
								className='col-span-full bg-primary/10 text-primary p-4 text-sm rounded-md mt-2'
								message='Source defined cursor field'>
								The cursor field and primary key for this stream is source-defined and cannot be
								deselected.
							</InfoAlert>
						</div>
					) : (
						syncMode !== initialSyncMode && (
							<InfoAlert
								textColor='black'
								className='col-span-full bg-primary/10 text-primary p-4 text-sm rounded-md mt-2'
								message={
									<>
										<strong>Warning:</strong> Different sync modes affect how data is transferred
										and stored. Make sure to choose the mode that best suits your needs.{' '}
										<Link
											className='text-primary'
											href={'https://docs.airbyte.com/using-airbyte/core-concepts/sync-modes/'}
											rel='noopener noreferrer'
											target='_blank'>
											Learn more about sync modes here
										</Link>
									</>
								}
							/>
						)
					)}
					<div>
						<label htmlFor='syncMode' className='block text-sm font-medium text-foreground'>
							Sync Mode
						</label>
						<select
							name={`${streamName}_syncMode`}
							className='capitalize mt-1 block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background text-foreground'
							value={syncMode}
							data-parent={streamName}
							onChange={e => {
								const newMode = e.target.value;
								setSyncMode(newMode);
							}}
							disabled={readonly}>
							{SyncModes.map(mode => {
								const modeAvailable =
									mode === 'full_refresh_overwrite' || streamProperty?.syncModes?.includes(mode);
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
								className='col-span-full bg-destructive/10 text-destructive p-4 text-sm rounded-md mt-2'
								message='Connector uses nested fields'>
								Cursor and primary key selection for nested fields is not yet supported.
							</InfoAlert>
						)}
					</div>
					{canSelectPrimaryKey && (
						<div>
							<label
								htmlFor='primaryKey'
								className='flex text-sm font-medium text-foreground py-1 space-x-1'>
								<span>Primary Key</span>
								<span>
									<ToolTip
										content='Select the primary key field, or choose multiple fields to form a compound primary key.'
										placement='top'
										arrow={true}>
										<InformationCircleIcon className='h-4 w-4' />
									</ToolTip>
								</span>
							</label>
							<Select
								value={primaryKey?.length > 0 ? primaryKey[0] : ''}
								onValueChange={value => {
									if (!value) {
										return setPrimaryKey([]);
									}
									setPrimaryKey([value]);
								}}
								disabled={!canSelectPrimaryKey}>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Select primary key' />
								</SelectTrigger>
								<SelectContent>
									{streamProperty?.propertyFields?.map(field => {
										const fieldValue = field.join('.');
										return (
											<SelectItem key={fieldValue} value={fieldValue}>
												{fieldValue}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>
					)}
					<table className='w-full'>
						<thead>
							<tr>
								<th className='text-left text-sm font-medium text-muted-foreground py-2'>Field</th>
								<th className='text-left text-sm font-medium text-muted-foreground py-2'>Type</th>
								<th className='text-left text-sm font-medium text-muted-foreground py-2'>
									Description
								</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(stream.stream.jsonSchema.properties).map(
								([key, value]: [string, any]) => {
									const fieldType = Array.isArray(value['type'])
										? value['type'].filter(x => x !== 'null')
										: value['type'];
									return (
										<tr key={key} className='border-t border-border'>
											<td className='py-2'>
												<div className='flex items-center gap-2'>
													<input
														type='checkbox'
														checked={checkedChildren.includes(key)}
														onChange={() => setCheckedChildren({ name: key })}
														className='rounded border-input text-primary focus:ring-primary bg-background'
													/>
													<span className='text-foreground'>{key}</span>
												</div>
											</td>
											<td className='py-2 text-muted-foreground'>{fieldType}</td>
											<td className='py-2'>
												<input
													type='text'
													value={descriptionsMap[key]?.description || ''}
													onChange={e => {
														setDescriptionsMap({
															...descriptionsMap,
															[key]: {
																...descriptionsMap[key],
																description: e.target.value
															}
														});
													}}
													className='w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm'
													placeholder='Add a description...'
												/>
											</td>
										</tr>
									);
								}
							)}
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
	streamState
}: {
	streams?: any;
	streamProperties?: any;
	readonly?: boolean;
	streamState?: StreamConfigMap;
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
					/>
				);
			})}
		</div>
	);
}
