'use strict';
import {
	HandRaisedIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';

import * as API from '../api';
import CreateAgentModal from '../components/CreateAgentModal';
import { useAccountContext } from '../context/account';

export default function CrewForm({ agentChoices = [], crew = {}, editing, compact=false, callback, fetchAgents }
	: { agentChoices?: any[], crew?: any, editing?: boolean, compact?: boolean, callback?: Function, fetchAgents?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modalOpen, setModalOpen] = useState(false);
	const [crewState, setCrew] = useState(crew);
	const [error, setError] = useState();

	const initialAgents = crew.agents && crew.agents.map(a => {
		const oa = agentChoices.find(ai => ai._id === a);
		return { label: oa.name, value: a, allowDelegation: oa.allowDelegation };
	});
	const [agentsState, setAgentsState] = useState(initialAgents || []);
	const { _id, name, agents } = crewState;

	async function crewPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			agents: agentsState.map(a => a.value),
		};
		if (editing) {
			await API.editCrew(crewState._id, body, null, setError, null);
			toast.success('Crew Updated');
		} else {
			const addedCrew: any = await API.addCrew(body, null, toast.error, compact ? null : router);
			callback && addedCrew && callback(addedCrew._id);
		}
	}

	async function createAgentCallback() {
		await fetchAgents && fetchAgents();
		setModalOpen(false);
	}

	return (<>
		<CreateAgentModal open={modalOpen} setOpen={setModalOpen} callback={createAgentCallback} />
		<form onSubmit={crewPost}>
			<input
				type='hidden'
				name='_csrf'
				value={csrf}
			/>

			<div className={`space-y-${compact ? '6' : '12'}`}>

				<div className={`grid grid-cols-1 gap-x-8 gap-y-10 pb-6 border-b border-gray-900/10 pb-${compact ? '6' : '12'} md:grid-cols-${compact ? '1' : '3'}`}>
					{!compact && <div>
						<h2 className='text-base font-semibold leading-7 text-gray-900 dark:text-white'>Crew Details</h2>
						<p className='mt-1 text-sm leading-6 text-gray-600 dark:text-slate-400'>Choose the name and team members to use for this crew.</p>
					</div>}

					<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
						<div className='sm:col-span-12'>
							<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Crew Name
							</label>
							<div className='mt-2'>
								<input
									required
									type='text'
									name='name'
									id='name'
									defaultValue={name}
									className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								/>
							</div>
						</div>
		
						<div className='sm:col-span-12'>
							<label htmlFor='members' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
									Members
							</label>
							<div className='mt-2'>
								<Select
									isMultiple
									isSearchable
						            primaryColor={'indigo'}
						            classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
						            }}
						            value={agentsState}
						            onChange={(v: any) => {
										if (v && v.length > 0 && v[v.length-1]?.value == null) {
											return setModalOpen(true);
										}
										setAgentsState(v||[]);
        						   	}}
						            options={agentChoices
						            	.map(a => ({ label: a.name, value: a._id, allowDelegation: a.allowDelegation })) // map to options
						            	.concat([{ label: '+ Create new agent', value: null, allowDelegation: false }])} // append "add new"
						            formatOptionLabel={(data: any) => {
						            	const optionAgent = agentChoices.find(ac => ac._id === data.value);
						                return (<li
						                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
						                        data.isSelected
						                            ? 'bg-blue-100 text-blue-500'
						                            : 'dark:text-white'
						                    }`}
						                >
						                    {data.label}{optionAgent ? ` - ${optionAgent.role}` : null} 
								            {data.allowDelegation && <span className='tooltip z-100'>
									            <span className='h-5 w-5 inline-flex items-center rounded-full bg-green-100 mx-1 px-2 py-1 text-xs font-semibold text-green-700'>
       												<HandRaisedIcon className='h-3 w-3 absolute -ms-1' />
       											</span>
							        			<span className='tooltiptext'>
													This agent allows automatic task delegation.
												</span>
											</span>}
						                </li>);
						            }}
						        />
							</div>
						</div>

					</div>
				</div>			

			</div>

			<div className='mt-6 flex items-center justify-between gap-x-6'>
				{!compact && <button
					className='text-sm font-semibold leading-6 text-gray-900'
					onClick={(e) => {
						e.preventDefault();
						if (window.history.length > 1) {
							router.back();
						} else {
							router.push(`/${resourceSlug}/crews`);
						}
					}}
				>
					Back
				</button>}
				<button
					type='submit'
					className={`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}
				>
						Save
				</button>
			</div>
		</form>
	</>);

}
