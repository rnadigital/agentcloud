import Link from 'next/link';
import React, { useState } from 'react';
import { useAccountContext } from '../context/account';

export default function NewButtonSection({ link, emptyMessage, icon, message, buttonIcon, buttonMessage, disabled }) {

	const [accountContext]: any = useAccountContext();
	const { account } = accountContext as any;
	const resourceSlug = account.currentTeam;

	return (
		<div className='text-center py-4'>
			{icon}
			<h3 className='mt-2 text-sm font-semibold text-gray-900'>{emptyMessage}</h3>
			<p className='mt-1 text-sm text-gray-500'>{message}</p>
			<div className='mt-6'>
				<Link href={link}>
					<button
						disabled={true}
						type='button'
						className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
					>
						{buttonIcon}
						{buttonMessage}
					</button>
				</Link>
			</div>
		</div>
	);
}
