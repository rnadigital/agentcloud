import { InformationCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import DatasourceChunkingForm from 'components/DatasourceChunkingForm';
import DatasourceScheduleForm from 'components/DatasourceScheduleForm';
import InputField from 'components/form/InputField';
import SelectField from 'components/form/SelectField';
import InfoAlert from 'components/InfoAlert';
import ToolTip from 'components/shared/ToolTip';
import { useOnboardingFormContext } from 'context/onboardingform';
import { AU, BR, CA, EU, FlagComponent, JP, SG, US } from 'country-flag-icons/react/3x2';
import { defaultChunkingOptions } from 'misc/defaultchunkingoptions';
import { set } from 'mongoose';
import React, { useEffect, useReducer, useState } from 'react';
import { useDatasourceStore } from 'store/datasource';
import { DatasourceScheduleType, StreamConfig } from 'struct/datasource';
import { Retriever } from 'struct/tool';
import submittingReducer from 'utils/submittingreducer';
import { useShallow } from 'zustand/react/shallow';

interface DataSourceDetailsFormValues {
	chunkStrategy: string;
	retrievalStrategy: string;
	k: number;
	embeddingField: string;
	scheduleType: string;
	timeUnit: string;
	units: string;
	cronExpression: string;
	enableConnectorChunking: boolean;
	toolDecayRate: number;
	stagedDatasource: any;
}

const DataSourceDetails = () => {
	const { control, watch, setValue } = useOnboardingFormContext<DataSourceDetailsFormValues>();

	const k = watch('k');
	const scheduleType = watch('scheduleType');
	const units = watch('units');
	const cronExpression = watch('cronExpression');
	const enableConnectorChunking = watch('enableConnectorChunking');
	const timeUnit = watch('timeUnit');
	const toolDecayRate = watch('toolDecayRate');
	const retrievalStrategy = watch('retrievalStrategy');

	const {
		setCurrentDatasourceStep,
		streamState,
		chunkingConfig,
		setChunkingConfig,
		setCurrentStep: setStep,
		stagedDatasource,
		embeddingField,
		setStore
	} = useDatasourceStore(
		useShallow(state => ({
			setCurrentDatasourceStep: state.setCurrentDatasourceStep,
			streamState: state.streamState,
			chunkingConfig: state.chunkingConfig,
			setChunkingConfig: state.setChunkingConfig,
			setCurrentStep: state.setCurrentStep,
			stagedDatasource: state.stagedDatasource,
			embeddingField: state.embeddingField,
			setStore: state.setStore
		}))
	);

	const getInitialEmbeddingField = () => {
		const fieldsArray = stagedDatasource?.discoveredSchema?.catalog?.streams.reduce(
			(acc, stream) => {
				const properties = stream.stream.jsonSchema.properties;
				const fields = Object.entries(properties).map(
					([fieldName, fieldSchema]: [string, any]) => ({
						name: fieldName,
						type: fieldSchema.type || fieldSchema.airbyte_type
					})
				);
				return acc.concat(fields);
			},
			[]
		);
		const firstStringField = fieldsArray?.find(
			//Get the first field that is a string, ane usea heuristic to not pick ones named "date".
			field => field.type === 'string' && !/date/i.test(field?.name || '')
		);
		return firstStringField?.name || fieldsArray?.[0]?.name || null;
	};

	const moveToNextStep = () => {
		setCurrentDatasourceStep(null);
		setStep(1);
	};

	const setScheduleType = (value: string) => {
		setValue('scheduleType', value);
	};
	const setTimeUnit = (value: string) => {
		setValue('timeUnit', value);
	};
	const setUnits = (value: string) => {
		setValue('units', value);
	};
	const setCronExpression = (value: string) => {
		setValue('cronExpression', value);
	};
	const setEnableConnectorChunking = (value: boolean) => {
		setValue('enableConnectorChunking', value);
	};
	const setToolDecayRate = (value: number) => {
		setValue('toolDecayRate', value);
	};

	// const [chunkingConfig, setChunkingConfig] = useReducer(submittingReducer, {
	// 	...defaultChunkingOptions
	// });
	//

	useEffect(() => {
		setValue('scheduleType', DatasourceScheduleType.MANUAL);
		setValue('cronExpression', '0 12 * * *');
		setValue('retrievalStrategy', Retriever.SELF_QUERY);
		setValue('toolDecayRate', 0.5);
		setValue('timeUnit', 'day');
		setValue('enableConnectorChunking', false);
		setValue('units', '');
		setValue('chunkStrategy', 'semantic');
	}, []);

	useEffect(() => {
		if (!embeddingField) {
			const initialEmbeddingField = getInitialEmbeddingField();
			setStore({ embeddingField: initialEmbeddingField });
		}
	}, [stagedDatasource]);

	return (
		<div className='text-gray-900 text-sm'>
			<div className='border border-gray-300 p-4 flex flex-col gap-y-3 mt-6'>
				<div>
					<label
						htmlFor='embeddingField'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
						Field To Embed<span className='text-red-700'> *</span>
					</label>
					<div>
						<select
							required
							name='embeddingField'
							id='embeddingField'
							onChange={e => {
								setStore({ embeddingField: e.target.value });
							}}
							value={embeddingField}
							className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'>
							<optgroup label='Select field to embed' key='embeddingField_optgroup_0' disabled>
								Select field to embed
							</optgroup>
							{Object.entries(streamState)
								.filter((e: [string, StreamConfig]) => e[1].checkedChildren.length > 0)
								.map((stream: [string, StreamConfig], ei: number) => {
									return (
										<optgroup label={stream[0]} key={`embeddingField_optgroup_${ei}`}>
											{stream[1].checkedChildren.map((sk, ski) => (
												<option key={`embeddingField_option_${ski}`} value={sk}>
													{sk}
												</option>
											))}
										</optgroup>
									);
								})}
						</select>
					</div>
				</div>

				<div className='flex w-full items-center'>
					<div className='w-1/2'>
						<div>Chunk Strategy</div>
						<div className='text-gray-500'>
							Default region is set by the team creator, you select a different one
						</div>
					</div>
					<div className='w-1/2'>
						<SelectField<DataSourceDetailsFormValues>
							name='chunkStrategy'
							control={control}
							rules={{
								required: 'Chunking strategyis required'
							}}
							options={[
								{ label: 'Semantic', value: 'semantic' },
								{ label: 'Syntactic', value: 'syntactic' },
								{ label: 'Statistical', value: 'statistical' },
								{ label: 'Rule-based', value: 'rule_based' }
							]}
							placeholder='Select a chunking strategy...'
						/>
					</div>
				</div>

				<div className='flex w-full items-center'>
					<div className='w-1/2'>
						<div>Retrieval Strategy</div>
						<div className='text-gray-500'>
							Determines how to find and retrieve relevant data from the chunks.
						</div>
					</div>
					<div className='w-1/2'>
						<SelectField<DataSourceDetailsFormValues>
							name='retrievalStrategy'
							control={control}
							rules={{
								required: 'Retrieval strategy is required'
							}}
							options={[
								{ label: 'Self Query', value: Retriever.SELF_QUERY },
								{ label: 'Raw Similarity Search', value: Retriever.RAW },
								{ label: 'Time Weighted', value: Retriever.TIME_WEIGHTED },
								{ label: 'Multi Query', value: Retriever.MULTI_QUERY }
							]}
							placeholder='Select a retrieval strategy...'
						/>
					</div>
				</div>

				{retrievalStrategy === Retriever.TIME_WEIGHTED && (
					<div className='mt-2'>
						<label
							htmlFor='toolDecayRate'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Decay Rate
						</label>
						<div>
							<input
								type='range'
								id='toolDecayRate'
								name='toolDecayRate'
								required
								min='0'
								max='1'
								step='0.01'
								value={toolDecayRate}
								onChange={e => setToolDecayRate(parseFloat(e.target.value))}
								className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
							/>
							<div className='flex justify-between text-xs text-gray-600'>
								<span>0</span>
								<span>
									<div className='w-full text-center mb-2'>{toolDecayRate}</div>
									{(toolDecayRate === 1 || toolDecayRate === 0) && (
										<InfoAlert message='A decay rate of exactly 0 or 1 is equivalent to default similarity search' />
									)}
								</span>
								<span>1</span>
							</div>
						</div>
					</div>
				)}

				<div className='flex w-full items-center'>
					<div className='w-1/2 self-start'>
						<div>Top K Results</div>
						<div className='text-gray-500'>
							Specify how many of the top results to return from your query.
						</div>
					</div>
					<div className='w-1/2'>
						<InputField<DataSourceDetailsFormValues>
							name='k'
							control={control}
							rules={{
								required: 'Tok K Results is required'
							}}
							placeholder='5'
							type='number'
						/>

						{k >= 10 && (
							<div className='bg-orange-50 rounded-md p-4 text-sm text-orange-800'>
								Selecting values greater 10 can slow queries and increase token costs due to the
								larger data volume
							</div>
						)}
					</div>
				</div>

				<DatasourceScheduleForm
					scheduleType={scheduleType}
					setScheduleType={setScheduleType}
					timeUnit={timeUnit}
					setTimeUnit={setTimeUnit}
					units={units}
					setUnits={setUnits}
					cronExpression={cronExpression}
					setCronExpression={setCronExpression}
				/>

				<div className=''>
					<label
						htmlFor='overlap_all'
						className='inline-flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
						Enable row chunking
						<span className='ml-2'>
							<ToolTip
								content='If enabled, applies the configured chunking strategy to the "Field to embed". Useful if your field to embed contains text or markdown that needs to be broken into smaller chunks.'
								placement='top'
								arrow={true}>
								<InformationCircleIcon className='h-4 w-4' />
							</ToolTip>
						</span>
					</label>
					<input
						type='checkbox'
						name='enableConnectorChunking'
						checked={enableConnectorChunking}
						onChange={e => setEnableConnectorChunking(e.target.checked)}
						className='ml-2 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:bg-slate-800 dark:ring-slate-600'
					/>
				</div>

				{enableConnectorChunking && (
					<DatasourceChunkingForm
						chunkingConfig={chunkingConfig}
						setChunkingConfig={setChunkingConfig}
						isConnector={true}
					/>
				)}

				<div className='flex justify-end'>
					<button
						type='button'
						className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
						onClick={moveToNextStep}>
						Continue
					</button>
				</div>

				<div className='flex bg-primary-50 items-center p-2 rounded-lg gap-2'>
					<UserPlusIcon className='h-4 w-4 text-primary-500' />
					<span className='text-xs text-primary-900'>Not sure how to configure this page?</span>
					<button className='text-xs text-primary-500 ml-auto'> Invite a Developer!</button>
				</div>
			</div>
		</div>
	);
};

export default DataSourceDetails;
