'use strict';

import * as API from '@api';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { pricingMatrix } from 'struct/billing';

export default function TeamForm({ callback }: { callback?: Function }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const currentOrg = account?.orgs?.find(o => o.id === account?.currentOrg);
	const { stripePlan } = currentOrg?.stripe || {};
	const [teamState, setTeamState] = useState('');
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const posthog = usePostHog();

	async function teamPost(e) {
		e.preventDefault();
		const hasPermission = pricingMatrix[stripePlan].users !== 1;
		posthog.capture('createTeam', {
			teamName: e.target.name.value,
			stripePlan,
			hasPermission
		});
		if (!stripePlan || !hasPermission) {
			return setSubscriptionModalOpen(true);
		}
		const body = {
			resourceSlug,
			_csrf: csrf,
			teamName: e.target.name.value
		};
		const addedTeam: any = await API.addTeam(
			body,
			() => {
				toast.success('Added new team');
			},
			res => {
				toast.error(res);
			},
			router
		);
		callback && addedTeam && callback(addedTeam._id, addedTeam.orgId);
	}

	return (
		<>
			<SubscriptionModal
				open={subscriptionModalOpen !== false}
				setOpen={setSubscriptionModalOpen}
				title='Upgrade Required'
				text='You must be on the teams plan to create new teams.'
				buttonText='Upgrade'
			/>
			<form onSubmit={teamPost}>
				<div className={`space-y-12`}>
					<div className='grid grid-cols-1 gap-x-6 gap-y-8 max-w-2xl sm:grid-cols-6'>
						<div className='sm:col-span-6'>
							<label
								htmlFor='name'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-white'
							>
								Team Name
							</label>
							<div className='mt-2'>
								<input
									required
									type='text'
									name='name'
									id='name'
									defaultValue={teamState}
									className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								/>
							</div>
						</div>
					</div>
				</div>

				<div className='flex gap-x-6 justify-between items-center mt-6'>
					<Link href={`/${resourceSlug}/teams`}>
						<a className='text-sm font-semibold leading-6 text-gray-900'>Back</a>
					</Link>
					<button
						type='submit'
						className={`px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500`}
					>
						Create Team
					</button>
				</div>
			</form>
		</>
	);
}
