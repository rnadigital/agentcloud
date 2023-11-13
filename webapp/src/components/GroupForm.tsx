'use strict';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '../api';
import { toast } from 'react-toastify';
import Select from 'react-tailwindcss-select';
// import 'react-tailwindcss-select/dist/index.css';

export default function GroupForm({ agentChoices = [], group = {}, editing }: { agentChoices?: any[], group?: any, editing?: boolean }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const resourceSlug = account?.currentTeam;

	const router = useRouter();
	const [groupState, setGroup] = useState(group);
	const [error, setError] = useState();

	const initialAdminAgent = group.adminAgent && agentChoices.find(ai => ai._id === group.adminAgent);
	const [adminAgentState, setAdminAgentState] = useState(initialAdminAgent ? { label: initialAdminAgent.name, value: initialAdminAgent._id } : null);

	const initialAgents = group.agents && group.agents.map(a => {
		const oa = agentChoices.find(ai => ai._id === a);
		return { label: oa.name, value: a };
	});
	const [agentsState, setAgentsState] = useState(initialAgents || []);
	const { _id, name, agents } = groupState;

	async function groupPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			name: e.target.name.value,
			adminAgent: adminAgentState?.value,
			agents: agentsState.map(a => a.value),
		};
		if (editing) {
			await API.editGroup(groupState._id, body, null, setError, null);
			toast.success('Group Updated');
		} else {
			API.addGroup(body, null, toast.error, router);
			// toast.success('Group Added');
		}
	}

	return (<form onSubmit={groupPost}>
		<input
			type='hidden'
			name='_csrf'
			value={csrf}
		/>

		<div className='space-y-12'>

			<div className='grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3'>
				<div>
					<h2 className='text-base font-semibold leading-7 text-gray-900'>Group Details</h2>
					<p className='mt-1 text-sm leading-6 text-gray-600'>Choose the name and team members to use for this group.</p>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900'>
								Group Name
						</label>
						<div className='mt-2'>
							<input
								required
								type='text'
								name='name'
								id='name'
								defaultValue={name}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							/>
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900'>
								Group Admin
						</label>
						<div className='mt-2'>
							<Select
					            primaryColor={'indigo'}
					            value={adminAgentState}
					            onChange={(v: any) => setAdminAgentState(v)}
					            options={agentChoices.filter(a => a.type === 'UserProxyAgent').map(a => ({ label: a.name, value: a._id }))}
					            formatOptionLabel={data => {
									const optionAgent = agentChoices.find(ac => ac._id === data.value);
					                return (<li
					                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
					                        data.isSelected
					                            ? 'bg-blue-100 text-blue-500'
					                            : ''
					                    }`}
					                >
					                    {data.label}{` - ${optionAgent.systemMessage}`}
					                </li>);
					            }}
					        />
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900'>
								Group Members
						</label>
						<div className='mt-2'>
							<Select
								isMultiple
					            primaryColor={'indigo'}
					            value={agentsState}
					            onChange={(v: any) => setAgentsState(v)}
					            options={agentChoices.filter(a => a._id !== adminAgentState?.value).map(a => ({ label: a.name, value: a._id }))}
					            formatOptionLabel={data => {
					            	const optionAgent = agentChoices.find(ac => ac._id === data.value);
					                return (<li
					                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
					                        data.isSelected
					                            ? 'bg-blue-100 text-blue-500'
					                            : ''
					                    }`}
					                >
					                    {data.label}{` - ${optionAgent.systemMessage}`}
					                </li>);
					            }}
					        />
						</div>
					</div>

				</div>
			</div>			

		</div>

		<div className='mt-6 flex items-center justify-between gap-x-6'>
			<Link
				className='text-sm font-semibold leading-6 text-gray-900'
				href={`/${resourceSlug}/groups`}
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
