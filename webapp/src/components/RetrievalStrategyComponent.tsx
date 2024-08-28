import { InformationCircleIcon } from '@heroicons/react/20/solid';
import InfoAlert from 'components/InfoAlert';
import ToolTip from 'components/shared/ToolTip';
import React, { useEffect } from 'react';
import { MetadataFieldInfo, Retriever, ToolType } from 'struct/tool';

interface RetrievalStrategyProps {
	toolRetriever: Retriever;
	setToolRetriever: (value: Retriever) => void;
	toolDecayRate?: number;
	setToolDecayRate?: (value: number) => void;
	currentDatasource?: { sourceType: string };
	toolTimeWeightField?: string;
	setToolTimeWeightField?: (value: string) => void;
	metadataFieldInfo?: MetadataFieldInfo[];
	defaultRetriever?: Retriever;
	topK?: number;
	setTopK?: (value: number) => void;
}

const RetrievalStrategyComponent: React.FC<RetrievalStrategyProps> = ({
	toolRetriever,
	setToolRetriever,
	toolDecayRate,
	setToolDecayRate,
	currentDatasource,
	toolTimeWeightField,
	setToolTimeWeightField,
	metadataFieldInfo,
	defaultRetriever,
	topK = 4,
	setTopK
}) => {
	useEffect(() => {
		if (defaultRetriever) {
			setToolRetriever(defaultRetriever || Retriever.SELF_QUERY);
		}
	}, []);

	return (
		<div>
			<div className='mt-3'>
				<label
					htmlFor='toolRetriever'
					className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
				>
					Retrieval Strategy
				</label>
				<div>
					<select
						required
						id='toolRetriever'
						name='toolRetriever'
						className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						value={toolRetriever}
						onChange={e => setToolRetriever(e.target.value as Retriever)}
					>
						{defaultRetriever === Retriever.SELF_QUERY ? (
							<>
								<option value={Retriever.SELF_QUERY}>Self Query (Default)</option>
								<option value={Retriever.RAW}>Raw Similarity Search</option>
							</>
						) : (
							<>
								<option value={Retriever.RAW}>Raw Similarity Search (Default)</option>
								<option value={Retriever.SELF_QUERY}>Self Query</option>
							</>
						)}
						<option value={Retriever.MULTI_QUERY}>Multi Query</option>
						{currentDatasource?.sourceType !== 'file' &&
							toolTimeWeightField &&
							setToolTimeWeightField && (
								<option value={Retriever.TIME_WEIGHTED}>Time Weighted</option>
							)}
					</select>
				</div>
			</div>

			{toolRetriever === Retriever.TIME_WEIGHTED && (
				<>
					<div className='mt-2'>
						<label
							htmlFor='toolDecayRate'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
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
					{setToolTimeWeightField && (
						<div className='mt-2'>
							<label
								htmlFor='toolTimeWeightField'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Time Weight Field
							</label>
							<div>
								<select
									required
									id='toolTimeWeightField'
									name='toolTimeWeightField'
									className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									value={toolTimeWeightField}
									onChange={e => setToolTimeWeightField(e.target.value)}
								>
									{metadataFieldInfo?.map((column, ei) => (
										<option
											className='capitalize'
											key={`timeWeightField_option_${ei}`}
											value={column?.name}
										>
											{column?.name}
										</option>
									))}
								</select>
							</div>
						</div>
					)}
				</>
			)}

			<div className='mt-2'>
				<label
					htmlFor='topK'
					className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-4 flex items-center'
				>
					Top K Results
					<span className='ml-2'>
						<ToolTip
							content='The maximum number of documents that will be returned in a single RAG query by your agents.'
							placement='top'
							arrow={true}
						>
							<InformationCircleIcon className='h-4 w-4' />
						</ToolTip>
					</span>
				</label>
				<div>
					<input
						type='number'
						id='topK'
						name='topK'
						required
						min='1'
						value={topK}
						onChange={e => setTopK(parseInt(e.target.value, 10))}
						className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
					/>
				</div>
			</div>

			{topK > 10 && (
				<InfoAlert
					className='w-full my-2 m-0 p-4 bg-orange-300 rounded'
					message='High values (>10) for Top K will make queries slower and increase token cost as your agents have to process more data.'
					textColor='black'
				/>
			)}
		</div>
	);
};

export default RetrievalStrategyComponent;
