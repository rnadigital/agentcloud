import { CheckCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import cn from 'lib/cn';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Task } from 'struct/task';

interface HumanInputFormProps {
	formFields: Task['formFields'];
	sendMessage: (e: any, reset: any) => void;
}
const StructuredInputForm = ({ formFields, sendMessage }: HumanInputFormProps) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		control
	} = useForm();
	const onSubmit = data => {
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
							<>
								<div className='invisible xl:visible col-span-1'></div>

								<div
									key={field.name}
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3'
									)}
								>
									<label className='my-2'>{field.label}</label>
									<input
										placeholder={field.description}
										type={field.type === 'string' ? 'text' : field.type}
										{...register(field.name, { required: field.required })}
										className={cn(
											errors[field.name] && 'border-red-500 border-2',
											'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
										)}
									/>
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</>
						);
					case 'radio':
						return (
							<>
								<div className='invisible xl:visible col-span-1'></div>
								<div
									key={field.name}
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3'
									)}
								>
									<label className='my-2'>{field.label}</label>
									<Controller
										name={field.name}
										control={control}
										rules={{ required: field.required }}
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
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</>
						);
					case 'checkbox':
						return (
							<>
								<div className='invisible xl:visible col-span-1'></div>
								<div
									key={field.name}
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 my-2'
									)}
								>
									<label className='mb-2'>{field.label}</label>
									<Controller
										name={field.name}
										control={control}
										rules={{ required: field.required }}
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
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</>
						);
					case 'select':
					case 'multiselect':
						return (
							<>
								<div className='invisible xl:visible col-span-1'></div>

								<div
									key={field.name}
									className={cn(
										index === 0 && 'rounded-t-lg',
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 my-2'
									)}
								>
									<label>{field.label}</label>
									<select
										{...register(field.name, { required: field.required })}
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
								</div>
								<div className='invisible xl:visible col-span-1'></div>
							</>
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
