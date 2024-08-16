import cn from 'lib/cn';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Task } from 'struct/task';

interface HumanInputFormProps {
	formFields: Task['formFields'];
	sendMessage: (e: any, reset: any) => void;
}
const StructuredInputForm = ({ formFields, sendMessage }: HumanInputFormProps) => {
	const {
		register,
		handleSubmit,
		formState: { errors }
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
			className='bg-orange-300 grid grid-cols-1 xl:grid-cols-5 pb-2 gap-2'
		>
			{formFields.map(field => {
				switch (field.type) {
					case 'string':
					case 'number':
					case 'date':
						return (
							<>
								<div className='invisible xl:visible col-span-1'></div>

								<div
									key={field.name}
									className='flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3'
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
					case 'checkbox':
						return (
							<>
								<div className='invisible xl:visible col-span-1'></div>
								<div
									key={field.name}
									className='flex flex-col ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3'
								>
									<label>{field.label}</label>
									{field.options?.map(option => (
										<div key={option}>
											<input
												type={field.type}
												value={option}
												{...register(field.name, { required: field.required })}
												className={cn(errors[field.name] && 'border-red-500 border-2')}
											/>
											<label className='ml-2'>{option}</label>
										</div>
									))}
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
									className='flex ps-2 justify-start px-4 pt-1 col-span-1 xl:col-span-3 flex-col'
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
			<button type='submit' className='bg-blue-700 text-white px-4 py-2 rounded-lg'>
				Submit
			</button>
			<div className='invisible xl:visible col-span-1'></div>
		</form>
	);
};

export default StructuredInputForm;
