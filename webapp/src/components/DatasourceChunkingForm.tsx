'use strict';

export default function DatasourceChunkingForm({
	chunkStrategy,
	setChunkStrategy,
	chunkCharacter,
	setChunkCharacter
}) {
	return (
		<div className='mb-4'>
			<label
				htmlFor='chunkStrategy'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
			>
				Chunk Strategy<span className='text-red-700'> *</span>
			</label>
			<div>
				<select
					required
					name='chunkStrategy'
					id='chunkStrategy'
					onChange={e => setChunkStrategy(e.target.value)}
					value={chunkStrategy}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
				>
					<option value='semantic'>Semantic</option>
					<option value='character'>Character Splitting</option>
				</select>
			</div>
			{chunkStrategy === 'character' && (
				<>
					<label
						htmlFor='chunkCharacter'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
					>
						Chunking Character<span className='text-red-700'> *</span>
					</label>
					<div>
						<input
							type='text'
							required
							name='chunkCharacter'
							id='chunkCharacter'
							onChange={e => setChunkCharacter(e.target.value)}
							value={chunkCharacter}
							className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						/>
					</div>
				</>
			)}
		</div>
	);
}
