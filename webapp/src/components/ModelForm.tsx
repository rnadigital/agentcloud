'use strict';

import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';
import { useAccountContext } from '../context/account';

export default function ModelForm({ model = {}, credentials = [], editing, compact }: { model?: any, credentials?: any[], editing?: boolean, compact?: boolean }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modelState, setModelState] = useState(model);
	const [modelName, setModelName] = useState(modelState?.name || '');
	const [debouncedValue, setDebouncedValue] = useState(null);

	async function modelPost(e) {
		e.preventDefault();
		toast('modelPost');
	}

	return (<form onSubmit={modelPost}>
		<input
			type='hidden'
			name='_csrf'
			value={csrf}
		/>
		<div className='space-y-12'>
		
			<div className='space-y-6'>
				{!compact && <div>
					<h2 className='text-base font-semibold leading-7 text-gray-900 dark:text-white'>Model</h2>
					<p className='mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400'>Configure models to be used for agents and/or embedding data sources.</p>
				</div>}
				<div>
					<label className='text-base font-semibold text-gray-900'>Name</label>
					<div>
						<input
							type='text'
							name='modelName'
							className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							onChange={e => setModelName(e.target.value)}
							required
							value={modelName}
						/>
					</div>
				</div>
				{/* TODO: other form params here */}
			</div>

		</div>
		<div className='mt-6 flex items-center justify-between gap-x-6'>
			<Link
				className='text-sm font-semibold leading-6 text-gray-900'
				href={`/${resourceSlug}/models`}
			>
				Back
			</Link>
			<button
				type='submit'
				className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				Save
			</button>
		</div>
	</form>);

}
