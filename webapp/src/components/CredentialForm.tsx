'use strict';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '../api';
import { toast } from 'react-toastify';

export default function CredentialForm({ credential = {}, editing }: { credential?: any, editing?: boolean }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const resourceSlug = account?.currentTeam;

	const router = useRouter();
	const [credentialState, setCredential] = useState(credential);
	const [error, setError] = useState();
	const { verifysuccess } = router.query;

	const { name, platform, key } = credentialState;

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
			API.addCredential(body, null, setError, router);
		}
	}

	return (<form onSubmit={credentialPost}>
		<input
			type='hidden'
			name='_csrf'
			value={csrf}
		/>
		<div className='space-y-12'>

			<div className='grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3'>
				<div>
					<h2 className='text-base font-semibold leading-7 text-gray-900'>Credential</h2>
					<p className='mt-1 text-sm leading-6 text-gray-600'>Add your credentials to authenticate agentcloud to various APIs.</p>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900'>
							Name
						</label>
						<div className='mt-2'>
							<input
								required
								type='text'
								name='name'
								id='name'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							/>
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900'>
							Platform
						</label>
						<div className='mt-2'>
							<select
								required
								id='model'
								name='llmConfigType'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							>
								<option disabled value=''>Select a platform...</option>
								<option value='OPENAI'>OpenAI</option>
								<option value='AZURE'>Azure</option>
							</select>
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='key' className='block text-sm font-medium leading-6 text-gray-900'>
							Key
						</label>
						<div className='mt-2'>
							<input
								required
								type='text'
								name='key'
								id='key'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							/>
						</div>
					</div>

				</div>

			</div>

		</div>

		<div className='mt-6 flex items-center justify-between gap-x-6'>
			<Link
				className='text-sm font-semibold leading-6 text-gray-900'
				href={`/${resourceSlug}/credentials`}
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
