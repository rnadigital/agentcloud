'use strict';

import * as API from '@api';
import { useAccountContext } from 'context/account';
import { Button } from 'modules/components/ui/button';
import { Input } from 'modules/components/ui/input';
import { Textarea } from 'modules/components/ui/textarea';
import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react';
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
		formState: { errors },
		setFocus
	} = useForm({
		defaultValues: variable || { name: '', defaultValue: '', type: '' }
	});
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	const onSubmit = async (data: any) => {
		if (editing) {
			await API.updateVariable(
				{ _csrf: csrf, resourceSlug, variableId: variable._id, ...data },
				() => {
					toast.success('Variable Updated');

					if (!callback) {
						fetchVariableFormData?.();
						router.push(`/${resourceSlug}/variables`);
					}
				},
				res => {
					toast.error(res);
				},
				null
			);
		} else {
			await API.addVariable(
				{ _csrf: csrf, resourceSlug, ...data },
				res => {
					callback?.({ label: data.name, value: res._id });
					toast.success('Variable Added');
					if (!callback) {
						fetchVariableFormData?.();
						router.push(`/${resourceSlug}/variables`);
					}
				},
				res => {
					toast.error(res);
				},
				null
			);
		}
	};

	useEffect(() => {
		setFocus('name');
	}, []);

	return (
		<>
			<form
				onSubmit={e => {
					e.preventDefault();
					e.stopPropagation();
					return handleSubmit(onSubmit)(e);
				}}
			>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='space-y-6'>
					<div>
						<label
							htmlFor='name'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							Name<span className='text-red-700'> *</span>
						</label>
						<Input
							id='name'
							type='text'
							{...register('name', {
								required: 'Name is required',
								pattern: {
									value: /^\S*$/,
									message: 'No spaces allowed'
								}
							})}
							placeholder='Enter a name for the variable'
							// className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.name ? 'border-red-500' : ''}`}
						/>
						{errors.name && <span className='text-red-500'>{errors.name.message as string}</span>}
					</div>

					<div>
						<label
							htmlFor='description'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							Description
						</label>
						<Textarea
							placeholder='Enter a description for the variable (optional)'
							id='description'
							{...register('description')}
							// className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.defaultValue ? 'border-red-500' : ''}`}
						/>
					</div>

					<div>
						<label
							htmlFor='defaultValue'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							Default Value<span className='text-red-700'> *</span>
						</label>
						<Input
							id='defaultValue'
							type='text'
							placeholder='Enter a default value for the variable'
							{...register('defaultValue', { required: true })}
							// className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.defaultValue ? 'border-red-500' : ''}`}
						/>
						{errors.defaultValue && <span className='text-red-500'>This field is required</span>}
					</div>

					<div className='mt-6 flex items-center justify-between gap-x-6'>
						<Button
							onClick={() => {
								router.push(`/${resourceSlug}/variables`);
							}}
							type='button'
							variant='outline'
						>
							Cancel
						</Button>
						<Button
							type='submit'
							className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
						>
							{editing ? 'Update Variable' : 'Save'}
						</Button>
					</div>
				</div>
			</form>
		</>
	);
}
