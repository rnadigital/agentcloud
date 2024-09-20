import * as API from '@api';
import { DocumentDuplicateIcon, PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import AgentAvatar from 'components/AgentAvatar';
import DevBadge from 'components/DevBadge';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function AgentList({ agents, fetchAgents }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, permissions } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

	async function deleteAgent(agentId) {
		API.deleteAgent(
			{
				_csrf: csrf,
				resourceSlug,
				agentId
			},
			() => {
				fetchAgents();
				toast('Deleted agent');
			},
			() => {
				toast.error('Error deleting agent');
			},
			router
		);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
			{agents.map(agent => (
				<li
					key={agent._id}
					className='col-span-1 divide-y divide-gray-200 dark:divide-slate-600 rounded-lg bg-white shadow dark:bg-slate-800 dark:border dark:border-slate-600'
				>
					<div className='flex w-full items-center justify-between space-x-6 p-6'>
						<div className='flex-1 truncate'>
							<div className='flex items-center space-x-3'>
								<h3 className='truncate text-sm font-medium text-gray-900 dark:text-white'>
									{agent.name}
								</h3>
								<DevBadge label='Agent ID' value={agent?._id} />
							</div>
							<p className='my-1 truncate text-sm text-gray-500 dark:text-slate-400'>
								{agent.model}
							</p>
						</div>
						<div className='h-10 w-10 flex-shrink-0 rounded-full bg-gray-300 dark:bg-slate-700 text-center text-xl font-bold overflow-hidden'>
							<AgentAvatar agent={agent} fill={true} />
						</div>
					</div>
					<div>
						<div className='-mt-px flex divide-x divide-gray-200 dark:divide-slate-600'>
							{permissions.get(Permissions.EDIT_AGENT) && (
								<div className='flex w-0 flex-1'>
									<a
										href={`/${resourceSlug}/agent/${agent._id}/edit`}
										className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white'
									>
										<PencilIcon
											className='h-5 w-5 text-gray-400 dark:text-white'
											aria-hidden='true'
										/>
										Edit
									</a>
								</div>
							)}
							{permissions.get(Permissions.CREATE_AGENT) && (
								<div className='flex w-0 flex-1'>
									<a
										href={`/${resourceSlug}/agent/add?agentId=${encodeURIComponent(agent._id)}`}
										className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white'
									>
										<DocumentDuplicateIcon
											className='h-5 w-5 text-gray-400 dark:text-white'
											aria-hidden='true'
										/>
										Clone
									</a>
								</div>
							)}
							{permissions.get(Permissions.DELETE_AGENT) && (
								<div className='-ml-px flex w-0 flex-1'>
									<button
										onClick={e => {
											posthog.capture('deleteAgent', {
												name: agent.name,
												id: agent._id,
												modelId: agent.modelId,
												functionModelId: agent.functionModelId
											});
											deleteAgent(agent._id);
										}}
										className='relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-red-600'
									>
										<TrashIcon className='h-5 w-5 text-red-600' aria-hidden='true' />
										Delete
									</button>
								</div>
							)}
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
