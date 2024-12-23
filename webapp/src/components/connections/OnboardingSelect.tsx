import {
	Listbox,
	ListboxButton,
	ListboxOption,
	ListboxOptions,
	Transition
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useAccountContext } from 'context/account';
import { useThemeContext } from 'context/themecontext';
import React, { Fragment } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { ReactSVG } from 'react-svg';

interface Option {
	label?: string;
	value: string;
	iconURL?: string;
	recommended?: boolean;
	callback?: () => void;
}

interface OnboardingSelectProps<TFieldValues extends FieldValues> {
	options: Option[];
	classNames?: {
		listboxButton?: string;
		listboxOptions?: string;
		listboxOption?: string;
		listboxOptionSelected?: string;
		listboxOptionActive?: string;
	};
	control: Control<TFieldValues>;
	name: Path<TFieldValues>;
	placeholder?: string;
	callback?: () => void;
}

const OnboardingSelect = <TFieldValues extends FieldValues>({
	options,
	classNames,
	control,
	name,
	placeholder,
	callback
}: OnboardingSelectProps<TFieldValues>) => {
	const { theme } = useThemeContext();
	const [accountContext]: any = useAccountContext();
	const { account } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
	return (
		<Controller
			name={name}
			control={control}
			render={({ field: { onChange, value } }) => {
				const handleChange = (selectedOption: Option) => {
					onChange(selectedOption);
					callback?.();
				};
				return (
					<Listbox value={value} onChange={handleChange}>
						{({ open }) => (
							<>
								<div className='mt-1 relative w-full text-sm'>
									<ListboxButton
										className={clsx(
											'rounded h-11 relative w-full border border-gray-300 dark:border-gray-600 shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500',
											classNames?.listboxButton
										)}
									>
										<span className='flex items-center dark:text-gray-300'>
											{value?.iconURL && <ReactSVG src={value.iconURL} className='h-6 w-6 mr-2' />}
											<span
												className={clsx('block truncate', {
													'text-gray-400': !value?.label
												})}
											>
												{value?.label || placeholder}
											</span>
										</span>
										<span className='ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
											<ChevronDownIcon
												className={clsx('h-5 w-5 text-gray-400 transition-transform duration-300', {
													'rotate-180': open
												})}
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
										<ListboxOptions
											className={clsx(
												'absolute z-10 mt-1 w-max bg-white shadow-lg max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-auto',
												classNames?.listboxOptions
											)}
										>
											{options
												.filter(o => o.value)
												.map(option => {
													// const modelAllowed = pricingMatrix[stripePlan]?.llmModels?.includes(
													// 	option.value
													// );
													return (
														<ListboxOption
															// disabled={!modelAllowed}
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
																	<span className='flex justify-between'>
																		<span className='flex'>
																			{option.iconURL && (
																				<ReactSVG src={option.iconURL} className='h-6 w-6 mr-2' />
																			)}
																			<span
																				className={clsx(
																					selected
																						? ['font-semibold', classNames?.listboxOptionSelected]
																						: 'font-normal',
																					'block'
																				)}
																			>
																				{option.label || option.value}
																			</span>
																		</span>
																		{option.recommended && (
																			<span className='bg-gray-700 text-white text-xs font-semibold px-2 py-1 rounded ml-11'>
																				Recommended
																			</span>
																		)}
																		{/* {!modelAllowed && (
																			<span className='bg-green-700 text-white text-xs font-semibold px-2 py-1 rounded ml-11 flex ms-4'>
																				<LockClosedIcon className='h-4 w-4 me-1' />
																				Upgrade to Teams Plan
																			</span>
																		)} */}
																	</span>
																</>
															)}
														</ListboxOption>
													);
												})}
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
