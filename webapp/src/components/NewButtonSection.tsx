import Link from 'next/link';
import React from 'react';

export default function NewButtonSection({
	emptyMessage,
	icon,
	message,
	buttonIcon,
	buttonMessage,
	setOpen,
	disabled,
	link
}: {
	emptyMessage: string;
	icon?: any;
	message: string;
	buttonIcon: any;
	buttonMessage: string;
	disabled?: boolean;
	setOpen?: (open: boolean) => void;
	link?: string;
}) {
	return (
		<div className='text-center py-4'>
			{icon}
			<h3 className='mt-2 text-sm font-semibold text-gray-900'>{emptyMessage}</h3>
			<p className='mt-1 text-sm text-gray-500'>{message}</p>
			<div className='mt-6'>
				<button
					disabled={disabled}
					type='button'
					onClick={() => setOpen(true)}
					className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'>
					{buttonIcon}
					{buttonMessage}
				</button>
			</div>
		</div>
	);
}
