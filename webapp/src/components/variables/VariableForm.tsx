'use strict';

import * as API from '@api';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function VariableForm({
	variable,
	editing,
	fetchVariableFormData,
	callback
}: {
	variable?: any;
	editing?: boolean;
	fetchVariableFormData?: Function;
	callback?: Function;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm({
		defaultValues: variable || { name: '', defaultValue: '', type: '' }
	});
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	const onSubmit = async (data: any) => {
		if (editing) {
			// Call API to update variable
			await API.updateVariable(
				{ _csrf: csrf, resourceSlug, variableId: variable._id, ...data },
				() => {
					toast.success('Variable Updated');
				},
				res => {
					toast.error(res);
				},
				null
			);
		} else {
			// Call API to create new variable
			await API.addVariable(
				{ _csrf: csrf, resourceSlug, ...data },
				res => {
					callback?.({ label: data.name, value: res._id });
					toast.success('Variable Added');
				},
				res => {
					toast.error(res);
				},
				null
			);
		}

		if (!callback) {
			fetchVariableFormData?.();
			router.push(`/${resourceSlug}/variables`);
		}
	};

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='space-y-6'>
					<div>
						<label
							htmlFor='name'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							Name<span className='text-red-700'> *</span>
						</label>
						<input
							id='name'
							type='text'
							{...register('name', { required: true })}
							className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.name ? 'border-red-500' : ''}`}
						/>
						{errors.name && <span className='text-red-500'>This field is required</span>}
					</div>

					<div>
						<label
							htmlFor='defaultValue'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							Default Value<span className='text-red-700'> *</span>
						</label>
						<input
							id='defaultValue'
							type='text'
							{...register('defaultValue', { required: true })}
							className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.defaultValue ? 'border-red-500' : ''}`}
						/>
						{errors.defaultValue && <span className='text-red-500'>This field is required</span>}
					</div>

					<div className='mt-6 flex items-center justify-between gap-x-6'>
						<button
							type='submit'
							className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
						>
							{editing ? 'Update Variable' : 'Add Variable'}
						</button>
					</div>
				</div>
			</form>
		</>
	);
}
