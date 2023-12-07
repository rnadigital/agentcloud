'use strict';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '../api';
import { toast } from 'react-toastify';

export default function CredentialForm({ credential = {}, editing, compact=false, callback }
	: { credential?: any, editing?: boolean, compact?: boolean, callback?: Function }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [credentialState, setCredential] = useState(credential);
	const [error, setError] = useState();
	const { verifysuccess } = router.query;

	const { name, platform, key, endpointURL } = credentialState;

	async function credentialPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			name: e.target.name.value,
			platform: e.target.platform.value,
			key: e.target.key.value,
		};
		if (editing) {
			//NOTE: no edit api for creds yet or maybe ever
			/*await API.editAgent(agentState._id, body, () => {
				toast.success('Agent Updated');
			}, setError, null);*/
		} else {
			const addedCredential = await API.addCredential(body, null, setError, compact ? null : router);
			console.log('addedCredential', addedCredential);
			callback && addedCredential && callback(addedCredential._id);
		}
	}

	return (<form onSubmit={credentialPost}>
		<input
			type='hidden'
			name='_csrf'
			value={csrf}
		/>
		<div className='space-y-12'>

			<div className={`grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-${compact ? '6' : '12'} md:grid-cols-${compact ? '1' : '3'}`}>
				{!compact && <div>
					<h2 className='text-base font-semibold leading-7 text-gray-900 dark:text-white'>Credential</h2>
					<p className='mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400'>Add your credentials to authenticate agentcloud to various APIs.</p>
				</div>}

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Name
						</label>
						<div className='mt-2'>
							<input
								required
								type='text'
								name='name'
								id='name'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							/>
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='platform' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Platform
						</label>
						<div className='mt-2'>
							<select
								required
								id='platform'
								name='platform'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								value={platform}
								onChange={e => setCredential({
									...credentialState,
									platform: e.target.value,
								})}
							>
								<option disabled value=''>Select a platform...</option>
								<option value='open_ai'>OpenAI</option>
								<option value='azure'>Azure</option>
							</select>
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='key' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Key
						</label>
						<div className='mt-2'>
							<input
								required
								type='password'
								name='key'
								id='key'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							/>
						</div>
					</div>

					{platform === 'azure' && <div className='sm:col-span-12'>
						<label htmlFor='endpointURL' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
							Endpoint URL
						</label>
						<div className='mt-2'>
							<input
								required
								type='test'
								name='endpointURL'
								id='endpointURL'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							/>
						</div>
					</div>}

				</div>

			</div>

		</div>

		<div className='mt-6 flex items-center justify-between gap-x-6'>
			{!compact && <Link
				className='text-sm font-semibold leading-6 text-gray-900'
				href={`/${resourceSlug}/credentials`}
			>
				Back
			</Link>}
			<button
				type='submit'
				className={`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}
			>
				Save
			</button>
		</div>

	</form>);

}
