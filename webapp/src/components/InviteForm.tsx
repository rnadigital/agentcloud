'use strict';

import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import cn from 'lib/cn';
import { useRouter } from 'next/router';
import { TeamRoleOptions } from 'permissions/roles';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { SubscriptionPlan } from 'struct/billing';

export default function InviteForm({ callback }: { callback?: Function }) {
	const [accountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [inviting, setInviting] = useState(false);
	const [role, setRole] = useState(TeamRoleOptions[0]);
	const [error, setError] = useState('');
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState(TeamRoleOptions[0].value);
	const posthog = usePostHog();

	async function handleSubmit(e) {
		setInviting(true);
		e.preventDefault();
		const hasPermission = [SubscriptionPlan.TEAMS, SubscriptionPlan.ENTERPRISE].includes(
			stripePlan
		);
		posthog.capture('inviteUser', {
			name,
			email,
			role: selectedRole,
			stripePlan,
			hasPermission //plan has permission
		});
		if (!stripePlan || !hasPermission) {
			setInviting(false);
			return setSubscriptionModalOpen(true);
		}
		if (!email || !name) {
			return;
		}
		try {
			await API.inviteToTeam(
				{
					_csrf: csrf,
					email,
					name,
					resourceSlug,
					template: selectedRole
				},
				() => {
					toast.success('Invitation sent');
					setName('');
					setEmail('');
					callback && callback();
				},
				res => {
					toast.error(res);
				},
				null
			);
		} catch (err) {
			toast.error('Error sending invitation');
		} finally {
			setInviting(false);
		}
	}

	return (
		<>
			<SubscriptionModal
				open={subscriptionModalOpen !== false}
				setOpen={setSubscriptionModalOpen}
				title='Upgrade Required'
				text='You must be on the Teams plan to invite team members.'
				buttonText='Upgrade'
			/>
			<form onSubmit={handleSubmit} className='w-full'>
				<div className='space-y-4'>
					<div>
						<label
							htmlFor='name'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'
						>
							Name
						</label>
						<div className='mt-1'>
							<input
								required
								type='text'
								name='name'
								id='name'
								value={name}
								onChange={e => setName(e.target.value)}
								className={cn(
									'bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 w-full h-10 p-1 pl-3 text-gray-500 dark:text-white disabled:bg-gray-200 text-sm'
								)}
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor='email'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'
						>
							Email
						</label>
						<div className='mt-1'>
							<input
								required
								type='email'
								name='email'
								id='email'
								value={email}
								onChange={e => setEmail(e.target.value)}
								className={cn(
									'bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 w-full h-10 p-1 pl-3 text-gray-500 dark:text-white disabled:bg-gray-200 text-sm'
								)}
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor='role'
							className='block text-sm font-medium text-gray-700 dark:text-gray-50'
						>
							Role
						</label>
						<select
							// className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
							className={cn(
								'bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 w-full h-10 p-1 pl-3 text-gray-500 dark:text-white disabled:bg-gray-200 text-sm'
							)}
							name='role'
							id='role'
							value={selectedRole}
							onChange={e => setSelectedRole(e.target.value)}
						>
							<option value='' disabled>
								Select Role
							</option>
							{TeamRoleOptions.map(role => (
								<option key={role.value} value={role.value}>
									{role.label}
								</option>
							))}
						</select>
					</div>

					{error && <p className='text-sm text-red-600'>{error}</p>}

					<div>
						<button
							type='submit'
							className='rounded-md bg-indigo-600 px-4 py-2 mt-2 text-sm font-semibold text-white hover:bg-indigo-500'
						>
							{inviting && <ButtonSpinner className='mt-1 me-1' />}
							Invite
						</button>
					</div>
				</div>
			</form>
		</>
	);
}
