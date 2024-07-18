
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import {  ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import React, { Fragment, useEffect, useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface Option {
	label?: string;
	value: string;
	iconURL?: string;
	recommended?: boolean;

}

interface OnboardingSelectProps<TFieldValues extends FieldValues> {
	options: Option[];
	classNames?: {
		listboxButton?: string;
		listboxOptions?: string;
		listboxOption?: string;
		listboxOptionSelected?: string;
		listboxOptionActive?: string;
	},
	control: Control<TFieldValues>
	name: Path<TFieldValues>
}

const OnboardingSelect = <TFieldValues extends FieldValues>({ options, classNames, control, name }: OnboardingSelectProps<TFieldValues>) => {

	return (
		<Controller
			name={name}
			control={control}
			render={({ field: { onChange, value } }) => {
				return (
					<Listbox value={value} onChange={onChange}>
						{({ open }) => (
							<>
								<div className='mt-1 relative w-full text-sm'>
									<ListboxButton className={clsx('h-11 relative w-full border border-gray-300 shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500', classNames?.listboxButton)}>
										<span className='flex items-center'>
											{value?.iconURL && <img src={value?.iconURL} className='h-6 w-6 mr-2' />}
											<span className='block truncate'>{value?.label}</span>
										</span>
										<span className='ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
											<ChevronDownIcon
												className={clsx(
													'h-5 w-5 text-gray-400 transition-transform duration-300',
													{ 'rotate-180': open }
												)}
												aria-hidden='true'
											/>
										</span>
									</ListboxButton>

									<Transition
										show={open}
										as={Fragment}
										leave='transition ease-in duration-100'
										leaveFrom='opacity-100'
										leaveTo='opacity-0'
									>
										<ListboxOptions className={clsx('absolute z-10 mt-1 w-max bg-white shadow-lg max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-auto', classNames?.listboxOptions)}>

											{options.map((option) => (
												<ListboxOption
													key={option.value}
													className={({ focus }) =>
														clsx(
															focus ? 'text-white bg-indigo-600' : 'text-gray-900',
															'cursor-default select-none relative py-2 pl-3 pr-9 min-h-9'
														)
													}
													value={option}
												>
													{({ selected, focus }) => (
														<>
															<span className='flex items-center'>
																{option.iconURL && <img src={option.iconURL} className='h-6 w-6 mr-2' />}
																<span
																	className={clsx(selected ? ['font-semibold', classNames?.listboxOptionSelected] : 'font-normal', 'block')}
																>
																	{option.label || option.value}
																</span>

																{option.recommended && <span className='bg-gray-700 text-white text-xs font-semibold px-2 py-1 rounded ml-11'>Recommended</span>}
															</span>
														</>
													)}
												</ListboxOption>
											))}
										</ListboxOptions>
									</Transition>
								</div>
							</>
						)}
					</Listbox>
				);
			}}
		/>
	);
};

export default OnboardingSelect;