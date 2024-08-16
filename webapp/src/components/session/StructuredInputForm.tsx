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
		<form onSubmit={handleSubmit(onSubmit)} className='grid grid-cols-1 xl:grid-cols-5 pb-2 px-2'>
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
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 bg-orange-300'
									)}
								>
									<label>{field.label}</label>
									<input
										placeholder={field.description}
										type={field.type === 'string' ? 'text' : field.type}
										{...register(field.name, { required: field.required })}
										className={cn(errors[field.name] && 'border-red-500 border-2')}
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
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 bg-orange-300'
									)}
								>
									<label>{field.label}</label>
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
															'px-2 py-1 rounded-full cursor-pointer',
															value === option
																? 'chip-selected bg-blue-500 text-white'
																: 'bg-gray-200 text-black'
														)}
														onClick={() => onChange(option)}
													>
														{option}
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
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 bg-orange-300'
									)}
								>
									<label>{field.label}</label>
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
															'px-2 py-1 rounded-full cursor-pointer',
															value?.includes(option)
																? 'chip-selected bg-blue-500 text-white'
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
										'flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 bg-orange-300'
									)}
								>
									<label>{field.label}</label>
									<select
										{...register(field.name, { required: field.required })}
										multiple={field.type === 'multiselect'}
										className={cn(errors[field.name] && 'border-red-500 border-2')}
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
			<div className='flex flex-col ps-2 px-4 pt-1 col-span-1 xl:col-span-3 bg-orange-300 rounded-b-lg justify-center items-center'>
				<button type='submit' className='bg-blue-700 text-white px-4 py-2 rounded-lg my-2 min-w-60'>
					Submit
				</button>
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</form>
	);
};

export default StructuredInputForm;
