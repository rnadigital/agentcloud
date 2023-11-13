import { TrashIcon, PencilIcon } from '@heroicons/react/20/solid';
import React, { useState } from 'react';
import { useAccountContext } from '../context/account';
import * as API from '../api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function AgentList({ agents, fetchAgents }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();

	async function deleteAgent(agentId) {
		API.deleteAgent({
			_csrf: csrf,
			agentId,
		}, () => {
			fetchAgents();
			toast('Deleted agent');
		}, () => {
			toast.error('Error deleting agent');
		}, router);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
			{agents.map((agent) => (
				<li key={agent._id} className='col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow'>
					<div className='flex w-full items-center justify-between space-x-6 p-6'>
						<div className='flex-1 truncate'>
							<div className='flex items-center space-x-3'>
								<h3 className='truncate text-sm font-medium text-gray-900'>{agent.name}</h3>
								{agent.type === 'UserProxyAgent' && <span className='inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'>
									User Proxy
								</span>}
							</div>
							<p className='mt-1 truncate text-sm text-gray-500'>{agent.type} - {agent.model}</p>
						</div>
						<div className='h-10 w-10 flex-shrink-0 rounded-full bg-gray-300 text-center text-xl font-bold pt-1'>
							<span>{agent.name.charAt(0).toUpperCase()}</span>
						</div>
					</div>
					<div>
						<div className='-mt-px flex divide-x divide-gray-200'>
							<div className='flex w-0 flex-1'>
								<a
									href={`/${account.currentTeam}/agent/${agent._id}/edit`}
									className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900'
								>
									<PencilIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
									Edit
								</a>
							</div>
							<div className='-ml-px flex w-0 flex-1'>
								<button
									onClick={(e) => {
										deleteAgent(agent._id);
									}}
									className='relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-red-600'
								>
									<TrashIcon className='h-5 w-5 text-red-600' aria-hidden='true' />
									Delete
								</button>
							</div>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
