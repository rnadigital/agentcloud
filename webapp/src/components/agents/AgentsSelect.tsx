import { HandRaisedIcon } from '@heroicons/react/20/solid';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';

export default function AgentsSelect({
	agentChoices,
	agentsState,
	onChange,
	setModalOpen,
	multiple,
	disabled
}: {
	agentChoices: any[];
	agentsState: any;
	onChange: Function;
	setModalOpen: Function;
	multiple?: boolean;
	disabled?: boolean;
}) {
	return (
		<div className='sm:col-span-12'>
			<label
				htmlFor='members'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
			>
				Agent{multiple ? 's' : null}
			</label>
			<div className='mt-2'>
				<Select
					isDisabled={disabled === true}
					isMultiple={multiple === true}
					isSearchable
					isClearable
					primaryColor={'indigo'}
					classNames={{
						menuButton: () =>
							'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
						menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
						list: 'dark:bg-slate-700',
						listGroupLabel: 'dark:bg-slate-700',
						listItem: (value?: { isSelected?: boolean }) =>
							`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${
								value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'
							}`
					}}
					value={agentsState?.length ? agentsState : null}
					onChange={(v: any) => {
						if (multiple) {
							if (v && v.length > 0 && v[v.length - 1]?.value == null) {
								return setModalOpen('agent');
							}
							onChange(v || []);
						} else {
							if (v?.value === null) {
								return setModalOpen('agent');
							}
							onChange(v);
						}
					}}
					options={[{ label: '+ Create new agent', value: null, allowDelegation: false }].concat(
						agentChoices.map(a => ({
							label: a.name,
							value: a._id,
							allowDelegation: a.allowDelegation
						}))
					)}
					formatOptionLabel={(data: any) => {
						const optionAgent = agentChoices.find(ac => ac._id === data.value);
						return (
							<li
								className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 justify-between flex hover:overflow-visible ${
									data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
								}`}
							>
								{data.label}
								{optionAgent ? ` - ${optionAgent.role}` : null}
								{data.allowDelegation && (
									<span className='tooltip z-100'>
										<span className='h-5 w-5 inline-flex items-center rounded-full bg-green-100 mx-1 px-2 py-1 text-xs font-semibold text-green-700'>
											<HandRaisedIcon className='h-3 w-3 absolute -ms-1' />
										</span>
										<span className='tooltiptext'>
											This agent allows automatic task delegation.
										</span>
									</span>
								)}
							</li>
						);
					}}
				/>
			</div>
		</div>
	);
}
