'use strict';

import * as API from '@api';
import InputField from 'components/form/InputField';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { Controller, FieldValues, FormProvider, useForm } from 'react-hook-form';
import Select from 'react-tailwindcss-select';
import { Option } from 'react-tailwindcss-select/dist/components/type';

export interface ApiKeyFormValues {
	name?: '';
	description: '';
	expirationDays: '30';
	ownerId?: ObjectId;
}

const dropdownOptions = [
	{
		value: '30',
		label: '30 days'
	},
	{
		value: '60',
		label: '60 days'
	},
	{
		value: '90',
		label: '90 days'
	},
	{
		value: 'never',
		label: 'Never expire'
	}
];

export default function ApiKeyForm({ callback }: { callback: () => void }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;
	const posthog = usePostHog();
	const [submitting, setSubmitting] = useState(false);
	const [endDateStr, setEndDateStr] = useState(null);
	const { handleSubmit, control, setValue } = useForm<ApiKeyFormValues>();
	const router = useRouter();
	const [error, setError] = useState();

	const methods = useForm<ApiKeyFormValues>();

	setValue('ownerId', account?._id);

	const getFutureDate = expirationDays => {
		const numOfDays = parseInt(expirationDays);
		const today = new Date();
		today.setDate(today.getDate() + numOfDays);
		return today.toDateString();
	};

	const onSubmit = async (data: ApiKeyFormValues) => {
		setSubmitting(true);
		try {
			await API.addKey(
				{
					...data,
					_csrf: csrf
				},
				null,
				setError,
				callback ? null : router
			);
		} finally {
			setSubmitting(false);
			callback && callback();
		}
	};

	if (!control) {
		return <Spinner />;
	}

	return (
		<div className='flex min-h-full flex-1 flex-col justify-start p-2 pt-6'>
			<FormProvider {...methods}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					action='/forms/account/apikey/add'
					method='POST'
					className='space-y-4'
				>
					<div className='w-full'>
						<InputField<ApiKeyFormValues>
							name='name'
							control={control}
							rules={{
								required: 'Name is required'
							}}
							label='Name*'
							type='text'
							disabled={submitting}
						/>
					</div>

					<div className='w-full'>
						<InputField<ApiKeyFormValues>
							name='description'
							control={control}
							rules={{}}
							label='Description'
							type='text'
							disabled={submitting}
							placeholder='A short description of where the key is used'
						/>
					</div>

					<div className='col-span-full'>
						<p className='text-sm text-gray-900 pb-2'>Expiration</p>
						<div className='flex flex-row w-full gap-4'>
							<div className='w-full'>
								<Controller
									render={({ field: { onChange, onBlur, value, ref } }) => {
										const label = dropdownOptions.find(x => x.value === value)?.label;
										const handleChange = selected => {
											onChange((selected as Option).value);
											setEndDateStr((selected as Option).value);
										};
										return (
											<Select
												options={dropdownOptions}
												value={{ value, label }}
												onChange={handleChange}
												primaryColor='inigo'
												classNames={{
													menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-transparent dark:border-slate-600',
													menuButton: () =>
														'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-transparent dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
													list: 'dark:bg-slate-700',
													listGroupLabel: 'dark:bg-slate-700',
													listItem: (value?: { isSelected?: boolean }) =>
														'block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-slate-600 dark:text-gray-50 dark:hover:text-white'
												}}
												placeholder='Select'
											/>
										);
									}}
									name='expirationDays'
									control={control}
									disabled={submitting}
								/>
							</div>

							{endDateStr !== null && (
								<div className='flex flex-col text-sm text-gray-500'>
									<p>
										{endDateStr === 'never'
											? 'This token will never expire.'
											: `This token will expire on: ${getFutureDate(endDateStr)}`}
									</p>
								</div>
							)}
						</div>
					</div>

					<div className='flex justify-between items-center w-full pt-4'>
						<Link href='/apikeys' className='text-sm font-semibold leading-6 text-gray-900'>
							Back
						</Link>
						<button
							type='submit'
							className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
						>
							Submit
						</button>
					</div>
				</form>
			</FormProvider>
		</div>
	);
}
