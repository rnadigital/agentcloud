'use strict';

import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import { useAccountContext } from 'context/account';
import cn from 'utils/cn';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit } from 'react-icons/fi'; // Pencil icon from react-icons
import { FaCircle } from 'react-icons/fa';

export default function TeamSettingsForm({
	callback,
	memberCount
}: {
	callback?: Function;
	memberCount: number;
}) {
	const [accountContext]: any = useAccountContext();
	const { csrf, account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [name, setName] = useState(teamName || '');
	const [saving, setSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	async function handleSubmit(e: any) {
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
					setIsEditing(false);
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
		<div>
			{/* If not editing, show team name with pencil icon */}
			{!isEditing ? (
				<div className='flex items-center space-x-2'>
					<span className='text-2xl font-medium text-gray-800 dark:text-white'>{name}</span>
					<div onClick={() => setIsEditing(true)} className='cursor-pointer'>
						<FiEdit className='text-md text-gray-400 hover:text-indigo-600' />
					</div>
				</div>
			) : (
				// If editing, show the form to edit team name
				<form onSubmit={handleSubmit} className='w-full'>
					<div className='space-y-4 mb-4'>
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
									maxLength={100}
									className={cn(
										'bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 w-full h-10 p-1 pl-3 text-gray-500 dark:text-white disabled:bg-gray-200 text-sm'
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
			)}
			<span className='text-gray-500 text-sm'>
				Team
				<FaCircle className='inline-block h-1 w-2 mx-[0.20rem]' />
				{memberCount} Members
			</span>
		</div>
	);
}
