'use strict';

import { InformationCircleIcon } from '@heroicons/react/20/solid';
import ToolTip from 'components/shared/ToolTip';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';

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
						className='block text-sm font-medium leading-6 text-foreground mt-2'>
						Format<span className='text-destructive'> *</span>
					</label>
					<div>
						<Select
							value={chunkingConfig.file_format}
							onValueChange={value => setChunkingConfig({ file_format: value })}
							required>
							<SelectTrigger>
								<SelectValue placeholder='Select format' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='txt'>Text</SelectItem>
								<SelectItem value='markdown'>Markdown</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			)}

			<label
				htmlFor='partitioning'
				className='block text-sm font-medium leading-6 text-foreground mt-2'>
				Partitioning Strategy<span className='text-destructive'> *</span>
			</label>
			<div>
				<Select
					value={chunkingConfig.partitioning}
					onValueChange={value => setChunkingConfig({ partitioning: value })}
					required>
					<SelectTrigger>
						<SelectValue placeholder='Select partitioning strategy' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='auto'>Auto</SelectItem>
						<SelectItem value='fast'>Fast</SelectItem>
						<SelectItem value='hi_res'>High Res</SelectItem>
						<SelectItem value='ocr_only'>OCR Only</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<label
				htmlFor='chunkStrategy'
				className='block text-sm font-medium leading-6 text-foreground mt-2'>
				Chunking Strategy<span className='text-destructive'> *</span>
			</label>
			<div>
				<Select
					value={chunkingConfig.strategy}
					onValueChange={value => setChunkingConfig({ strategy: value })}
					required>
					<SelectTrigger>
						<SelectValue placeholder='Select chunking strategy' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='basic'>Basic</SelectItem>
						<SelectItem value='by_title'>By Title</SelectItem>
						{!process.env.NEXT_PUBLIC_LOCAL_UNSTRUCTURED && (
							<>
								<SelectItem value='by_page'>By Page</SelectItem>
								<SelectItem value='by_similarity'>By Similarity</SelectItem>
							</>
						)}
					</SelectContent>
				</Select>
			</div>

			<label
				htmlFor='max_characters'
				className='block text-sm font-medium leading-6 text-foreground mt-4 flex items-center'>
				Max Characters
				<span className='ml-2'>
					<ToolTip
						content='The hard maximum size for a chunk. No chunk will exceed this number of characters.'
						placement='top'
						arrow={true}>
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
				className='block w-full rounded-md border border-input bg-background py-1.5 text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm sm:leading-6'
			/>

			<label
				htmlFor='new_after_n_chars'
				className='block text-sm font-medium leading-6 text-foreground mt-4 flex items-center'>
				New After N Characters
				<span className='ml-2'>
					<ToolTip
						content='The "soft" maximum size for a chunk. A chunk that exceeds this number will not be extended.'
						placement='top'
						arrow={true}>
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
				className='block w-full rounded-md border border-input bg-background py-1.5 text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm sm:leading-6'
			/>

			<label
				htmlFor='overlap'
				className='block text-sm font-medium leading-6 text-foreground mt-4 flex items-center'>
				Overlap
				<span className='ml-2'>
					<ToolTip
						content='Number of characters from the end of a chunk to include as a prefix on the next chunk.'
						placement='top'
						arrow={true}>
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
				className='block w-full rounded-md border border-input bg-background py-1.5 text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm sm:leading-6'
			/>

			<label
				htmlFor='similarity_threshold'
				className='block text-sm font-medium leading-6 text-foreground mt-4 flex items-center'>
				Similarity Threshold
				<span className='ml-2'>
					<ToolTip
						content='Threshold for determining similarity between chunks (0.0 to 1.0).'
						placement='top'
						arrow={true}>
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
				className='block w-full rounded-md border border-input bg-background py-1.5 text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm sm:leading-6'
			/>

			<div className='mt-4'>
				<label
					htmlFor='overlap_all'
					className='inline-flex items-center text-sm font-medium leading-6 text-foreground'>
					Overlap All
					<span className='ml-2'>
						<ToolTip
							content='Apply overlap between normal chunks, not just when splitting oversized chunks.'
							placement='top'
							arrow={true}>
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
					className='ml-2 rounded border-input text-primary shadow-sm focus:ring-primary bg-background'
				/>
			</div>
		</div>
	);
}
