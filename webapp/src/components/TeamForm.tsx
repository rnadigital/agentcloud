'use strict';

import * as API from '@api';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { pricingMatrix } from 'struct/billing';

export default function TeamForm({ teamName = '', editing, compact = false, callback }
	: { teamName?: string, editing?: boolean, compact?: boolean, callback?: Function }) {

	const [accountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const { stripePlan } = (account?.stripe||{});
	const [teamState, setTeamState] = useState(teamName);
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	async function teamPost(e) {
		e.preventDefault();
		console.log(stripePlan, pricingMatrix[stripePlan]);
		if (!stripePlan || pricingMatrix[stripePlan].users === 1) {
			return setSubscriptionModalOpen(true);
		}
		const body = {
			resourceSlug,
			_csrf: csrf,
			teamName: e.target.name.value,
		};
		const addedTeam: any = await API.addTeam(body, () => {
			toast.success('Added new team');
		}, (res) => {
			toast.error(res);
		}, compact ? null : router);
		callback && addedTeam && callback(addedTeam._id, addedTeam.orgId);
	}

	return (<>
		<SubscriptionModal open={subscriptionModalOpen !== false} setOpen={setSubscriptionModalOpen} title='Upgrade Required' text='You must be on the teams plan to create new teams.' buttonText='Upgrade' />
		<form onSubmit={teamPost}>
			<div className={`space-y-${compact ? '6' : '12'}`}>
				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
					<div className='sm:col-span-6'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900'>
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

			<div className='mt-6 flex items-center justify-between gap-x-6'>
				{!compact && <Link href={`/${resourceSlug}/teams`}>
					<a className='text-sm font-semibold leading-6 text-gray-900'>
						Back
					</a>
				</Link>}
				<button
					type='submit'
					className={`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 ${compact ? 'w-full' : ''}`}
				>
					Create Team
				</button>
			</div>
		</form>
	</>);
}
