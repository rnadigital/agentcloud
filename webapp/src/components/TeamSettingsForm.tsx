'use strict';

import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import { useAccountContext } from 'context/account';
import cn from 'lib/cn';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function TeamSettingsForm({ callback }: { callback?: Function }) {
	const [accountContext]: any = useAccountContext();
	const { csrf, account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [name, setName] = useState(teamName || '');
	const [saving, setSaving] = useState(false);

	async function handleSubmit(e) {
		setSaving(true);
		e.preventDefault();

		try {
			await API.editTeam(
				{
					_csrf: csrf,
					teamName: name,
					resourceSlug
				},
				() => {
					toast.success('Team name updated successfully');
					callback && callback();
				},
				res => {
					toast.error(res);
				},
				null
			);
		} catch (err) {
			console.error(err);
			toast.error('Error updating team');
		} finally {
			setSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className='w-full sm:w-1/2'>
			<div className='space-y-4'>
				<div>
					<label
						htmlFor='teamName'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'
					>
						Team Name
					</label>
					<div className='mt-1'>
						<input
							required
							type='text'
							name='teamName'
							id='teamName'
							value={name}
							onChange={e => setName(e.target.value)}
							className={cn(
								'bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 w-full h-10 p-1 pl-3 text-gray-500 dark:text-white disabled:bg-gray-200 text-sm'
							)}
						/>
					</div>
				</div>

				<div>
					<button
						type='submit'
						className='rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500'
					>
						{saving && <ButtonSpinner className='mt-1 me-1' />}
						Save
					</button>
				</div>
			</div>
		</form>
	);
}
