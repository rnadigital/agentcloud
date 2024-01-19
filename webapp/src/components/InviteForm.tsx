'use strict';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import * as API from '@api';
import { toast } from 'react-toastify';
import { useAccountContext } from 'context/account';

export default function InviteToTeamForm({ callback }: { callback?: Function }) {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [error, setError] = useState('');

	async function handleSubmit(e) {
		e.preventDefault();
		if (!email || !name) {
			return;
		}
		try {
			await API.inviteToTeam({
				_csrf: csrf,
				email,
				name,
				resourceSlug,
			}, () => {
				toast.success('Ageant Updated');
			}, (res) => {
				toast.error(res);
			}, null);
			toast.success('Invitation sent');
			setName('');
			setEmail('');
			callback && callback();
		} catch (err) {
			toast.error('Error sending invitation');
		}
	}

	return (
		<form onSubmit={handleSubmit} className='w-full sm:w-1/2'>
			<div className='space-y-4'>
				<div>
					<label htmlFor='email' className='block text-sm font-medium leading-6 text-gray-900'>
						Name
					</label>
					<div className='mt-1'>
						<input
							required
							type='text'
							name='name'
							id='name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							className='block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50'
						/>
					</div>
				</div>

				<div>
					<label htmlFor='email' className='block text-sm font-medium leading-6 text-gray-900'>
						Email
					</label>
					<div className='mt-1'>
						<input
							required
							type='email'
							name='email'
							id='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className='block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50'
						/>
					</div>
				</div>

				{error && <p className='text-sm text-red-600'>{error}</p>}

				<div>
					<button
						type='submit'
						className='rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500'
					>
						Invite
					</button>
				</div>
			</div>
		</form>
	);
}
