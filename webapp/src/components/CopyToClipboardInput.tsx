import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function CopyToClipboardInput({ dataToCopy }) {
	const handleCopyClick = async () => {
		try {
			await navigator.clipboard.writeText(dataToCopy);
			toast.success('Copied to clipboard');
		} catch {
			/* ignored for now */
		}
	};

	return (
		<div className='sm:col-span-12 flex flex-row gap-4 mt-4'>
			<div className='w-full'>
				<label
					htmlFor='link'
					className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
				>
					Shareable Link
				</label>
				<div className='flex rounded-md shadow-sm'>
					<input
						id='link'
						name='link'
						type='text'
						readOnly
						value={dataToCopy}
						className='block w-full rounded-none rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
					/>
					<button
						type='button'
						onClick={handleCopyClick}
						className='bg-white relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-slate-700 dark:ring-slate-600 dark:text-white'
					>
						<ClipboardDocumentIcon aria-hidden='true' className='-ml-0.5 h-5 w-5 text-gray-400' />
						Copy
					</button>
				</div>
			</div>
		</div>
	);
}
