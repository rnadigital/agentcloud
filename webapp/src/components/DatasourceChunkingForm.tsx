'use strict';

import { InformationCircleIcon } from '@heroicons/react/20/solid';
import ToolTip from 'components/shared/ToolTip';

export default function DatasourceChunkingForm({
	chunkingConfig,
	setChunkingConfig,
	isConnector = false
}) {
	const handleInputChange = key => e => {
		setChunkingConfig({ [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
	};

	return (
		<div className=''>
			{isConnector && (
				<>
					<label
						htmlFor='chunkStrategy'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
					>
						Format<span className='text-red-700'> *</span>
					</label>
					<div>
						<select
							required
							name='file_format'
							id='file_format'
							onChange={handleInputChange('file_format')}
							value={chunkingConfig.file_format}
							className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						>
							<option value='txt'>Text</option>
							<option value='markdown'>Markdown</option>
						</select>
					</div>
				</>
			)}

			<label
				htmlFor='partitioning'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
			>
				Partitioning Strategy<span className='text-red-700'> *</span>
			</label>
			<div>
				<select
					required
					name='partitioning'
					id='partitioning'
					onChange={handleInputChange('partitioning')}
					value={chunkingConfig.partitioning}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
				>
					<option value='auto'>Auto</option>
					<option value='fast'>Fast</option>
					<option value='hi_res'>High Res</option>
					<option value='ocr_only'>OCR Only</option>
				</select>
			</div>

			<label
				htmlFor='chunkStrategy'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
			>
				Chunking Strategy<span className='text-red-700'> *</span>
			</label>
			<div>
				<select
					required
					name='chunkStrategy'
					id='chunkStrategy'
					onChange={handleInputChange('strategy')}
					value={chunkingConfig.strategy}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
				>
					<option value='basic'>Basic</option>
					<option value='by_title'>By Title</option>
					{!process.env.NEXT_PUBLIC_LOCAL_UNSTRUCTURED && (
						<>
							<option value='by_page'>By Page</option>
							<option value='by_similarity'>By Similarity</option>
						</>
					)}
				</select>
			</div>

			<label
				htmlFor='max_characters'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-4 flex items-center'
			>
				Max Characters
				<span className='ml-2'>
					<ToolTip
						content='The hard maximum size for a chunk. No chunk will exceed this number of characters.'
						placement='top'
						arrow={true}
					>
						<InformationCircleIcon className='h-4 w-4' />
					</ToolTip>
				</span>
			</label>
			<input
				type='number'
				id='max_characters'
				name='max_characters'
				value={chunkingConfig.max_characters}
				onChange={handleInputChange('max_characters')}
				className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
			/>

			<label
				htmlFor='new_after_n_chars'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-4 flex items-center'
			>
				New After N Characters
				<span className='ml-2'>
					<ToolTip
						content='The “soft” maximum size for a chunk. A chunk that exceeds this number will not be extended.'
						placement='top'
						arrow={true}
					>
						<InformationCircleIcon className='h-4 w-4' />
					</ToolTip>
				</span>
			</label>
			<input
				type='number'
				id='new_after_n_chars'
				name='new_after_n_chars'
				value={chunkingConfig.new_after_n_chars || chunkingConfig.max_characters}
				onChange={handleInputChange('new_after_n_chars')}
				className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
			/>

			<label
				htmlFor='overlap'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-4 flex items-center'
			>
				Overlap
				<span className='ml-2'>
					<ToolTip
						content='Number of characters from the end of a chunk to include as a prefix on the next chunk.'
						placement='top'
						arrow={true}
					>
						<InformationCircleIcon className='h-4 w-4' />
					</ToolTip>
				</span>
			</label>
			<input
				type='number'
				id='overlap'
				name='overlap'
				value={chunkingConfig.overlap}
				onChange={handleInputChange('overlap')}
				className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
			/>

			<label
				htmlFor='similarity_threshold'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-4 flex items-center'
			>
				Similarity Threshold
				<span className='ml-2'>
					<ToolTip
						content='Threshold for determining similarity between chunks (0.0 to 1.0).'
						placement='top'
						arrow={true}
					>
						<InformationCircleIcon className='h-4 w-4' />
					</ToolTip>
				</span>
			</label>
			<input
				type='number'
				step='0.01'
				min='0'
				max='1'
				id='similarity_threshold'
				name='similarity_threshold'
				value={chunkingConfig.similarity_threshold}
				onChange={handleInputChange('similarity_threshold')}
				className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
			/>

			<div className='mt-4'>
				<label
					htmlFor='overlap_all'
					className='inline-flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
				>
					Overlap All
					<span className='ml-2'>
						<ToolTip
							content='Apply overlap between normal chunks, not just when splitting oversized chunks.'
							placement='top'
							arrow={true}
						>
							<InformationCircleIcon className='h-4 w-4' />
						</ToolTip>
					</span>
				</label>
				<input
					type='checkbox'
					id='overlap_all'
					name='overlap_all'
					checked={chunkingConfig.overlap_all}
					onChange={handleInputChange('overlap_all')}
					className='ml-2 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:bg-slate-800 dark:ring-slate-600'
				/>
			</div>
		</div>
	);
}
