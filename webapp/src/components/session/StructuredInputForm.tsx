import * as API from '@api';
import { CheckCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAccountContext } from 'context/account';
import cn from 'utils/cn';
import { useRouter } from 'next/router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Task } from 'struct/task';

interface HumanInputFormProps {
	formFields: Task['formFields'];
	sendMessage: (e: any, reset: any) => void;
	isShared?: boolean;
	sessionId: string;
	resourceSlug: string;
}

interface Form {
	[key: string]: string;
}

const StructuredInputForm = ({
	formFields,
	sendMessage,
	sessionId,
	resourceSlug,
	isShared
}: HumanInputFormProps) => {
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const {
		register,
		handleSubmit,
		formState: { errors },
		control
	} = useForm<Form>();

	const router = useRouter();

	const onSubmit = async data => {
		const matchingFields = formFields.filter(
			field => data.hasOwnProperty(field.name) && Boolean(field.variable)
		);

		if (matchingFields.length > 0) {
			const variables: Record<string, string> = {};
			matchingFields.forEach(field => {
				variables[field.name] = data[field.name];
			});
			if (isShared) {
				await API.publicUpdateSession({ sessionId, resourceSlug, variables }, null, null, router);
			} else {
				await API.updateSession(
					{
						_csrf: csrf,
						resourceSlug,
						sessionId,
						variables
					},
					null,
					toast.error,
					router
				);
			}
		}

		const statement = formFields
			.map(field => {
				const value = data[field.name];
				if (Array.isArray(value)) {
					return `${field.label} are ${value.join(', ')}.`;
				}
				return `${field.label} is ${value}.`;
			})
			.join(' ');
		sendMessage(statement, null);
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='grid grid-cols-1 xl:grid-cols-5 pb-2 px-2 dark:text-gray-50 text-gray-900'
		>
			{formFields.map((field, index) => {
				switch (field.type) {
					case 'string':
					case 'number':
					case 'date':
						return (
							<React.Fragment key={field.name}>
								<div className='invisible xl:visible col-span-1'></div>

								<div
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3'
									)}
								>
									<label className='my-2'>{field.label}</label>
									<input
										placeholder={field.description}
										type={field.type === 'string' ? 'text' : field.type}
										{...register(field.name, {
											required: field.required && 'field is required'
										})}
										className={cn(
											'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white',

											errors[field.name] && 'border-red-500 border-2'
										)}
									/>
									{errors && errors[field.name]?.message && (
										<div className='text-red-500 text-xs mt-1'>
											{errors[field.name].message as string}
										</div>
									)}
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</React.Fragment>
						);
					case 'radio':
						return (
							<React.Fragment key={field.name}>
								<div className='invisible xl:visible col-span-1'></div>
								<div
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3'
									)}
								>
									<label className='my-2'>{field.label}</label>
									<Controller
										name={field.name}
										control={control}
										rules={{ required: field.required && 'field is required' }}
										render={({ field: { onChange, value } }) => (
											<div className='flex flex-wrap gap-2'>
												{field.options?.map(option => (
													<div
														key={option}
														className={cn(
															'px-2 py-1 rounded-full cursor-pointer flex items-center gap-1',
															value === option
																? 'chip-selected bg-indigo-600 text-white'
																: 'bg-gray-200 text-black'
														)}
														onClick={() => onChange(option)}
													>
														{option}
														{value === option && <CheckCircleIcon className='h-5 w-5 text-white' />}
													</div>
												))}
											</div>
										)}
									/>
									{errors && errors[field.name]?.message && (
										<div className='text-red-500 text-xs mt-1'>
											{errors[field.name].message as string}
										</div>
									)}
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</React.Fragment>
						);
					case 'checkbox':
						return (
							<React.Fragment key={field.name}>
								<div className='invisible xl:visible col-span-1'></div>
								<div
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 my-2'
									)}
								>
									<label className='mb-2'>{field.label}</label>
									<Controller
										name={field.name}
										control={control}
										rules={{ required: field.required && 'field is required' }}
										render={({ field: { onChange, value } }) => (
											<div className='flex flex-wrap gap-2'>
												{field.options?.map(option => (
													<div
														key={option}
														className={cn(
															'px-2 py-1 rounded-full cursor-pointer flex items-center gap-1',
															value?.includes(option)
																? 'chip-selected bg-indigo-600 text-white'
																: 'bg-gray-200 text-black'
														)}
														onClick={() => {
															const newValue =
																Array.isArray(value) && value.includes(option)
																	? value.filter(v => v !== option)
																	: [...(Array.isArray(value) ? value : []), option];
															onChange(newValue);
														}}
													>
														{option}

														{value?.includes(option) && (
															<CheckCircleIcon className='h-5 w-5 text-white' />
														)}
													</div>
												))}
											</div>
										)}
									/>
									{errors && errors[field.name]?.message && (
										<div className='text-red-500 text-xs mt-1'>
											{errors[field.name].message as string}
										</div>
									)}
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</React.Fragment>
						);
					case 'select':
					case 'multiselect':
						return (
							<React.Fragment key={field.name}>
								<div className='invisible xl:visible col-span-1'></div>

								<div
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 my-2'
									)}
								>
									<label>{field.label}</label>
									<select
										{...register(field.name, {
											required: field.required && 'field is required'
										})}
										multiple={field.type === 'multiselect'}
										className={cn(
											errors[field.name] && 'border-red-500 border-2',
											'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
										)}
									>
										{field.options?.map(option => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</select>
									{errors && errors[field.name]?.message && (
										<div className='text-red-500 text-xs mt-1'>
											{errors[field.name].message as string}
										</div>
									)}
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</React.Fragment>
						);
					default:
						return null;
				}
			})}

			<div className='invisible xl:visible col-span-1'></div>
			<div className='flex flex-col ps-2 px-4 pt-1 col-span-1 xl:col-span-3 justify-center items-center my-2'>
				<button
					type='submit'
					className='bg-indigo-700 text-white px-4 py-2 rounded-lg my-2 sm:min-w-60 w-full sm:w-auto'
				>
					Submit
				</button>
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</form>
	);
};

export default StructuredInputForm;
