import { InformationCircleIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import ToolTip from 'components/shared/ToolTip';
import dayjs from 'dayjs';
import { ChangeEvent } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { FormFieldProps } from 'struct/form';
import { toSentenceCase } from 'utils/tosentencecase';

const ArrayField = ({ name, testId, type, disabled, property, isRequired }: FormFieldProps) => {
	const { control } = useFormContext();
	const { fields, append, remove } = useFieldArray({
		control,
		name
	});

	let inputType;
	switch (type) {
		case 'number':
		case 'integer':
			inputType = 'number';
			break;
		case 'boolean':
			inputType = 'checkbox';
			break;
		case 'date':
			inputType = 'date';
			break;
		case 'datetime-local':
		case 'date-time':
			inputType = 'datetime-local';
			break;
		default:
			inputType = 'text';
	}

	let defaultValue;
	switch (inputType) {
		case 'number':
		case 'integer':
			defaultValue = 0;
			break;
		case 'checkbox':
			defaultValue = false;
			break;
		case 'date':
			defaultValue = new Date().toISOString().split('T')[0];
			break;
		case 'datetime-local':
		case 'date-time':
			defaultValue = new Date().toISOString();
			break;
		default:
			defaultValue = '';
	}

	return (
		<div>
			<div className='flex items-center'>
				<label htmlFor={name} className='mr-1 text-sm dark:text-slate-400'>
					{property.title ? property.title : toSentenceCase(name)}
					{isRequired && <span className='text-red-500 ml-1 align-super'>*</span>}
				</label>
				{property.description && (
					<ToolTip content={property.description} allowHTML interactive>
						<div className='cursor-pointer'>
							<InformationCircleIcon className='h-4 w-4' />
						</div>
					</ToolTip>
				)}
			</div>
			{fields.map((field, index) => (
				<div key={field.id} className='flex items-center mt-2'>
					<Controller
						name={`${name}[${index}]`}
						control={control}
						render={({ field, fieldState }) => {
							const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
								switch (type) {
									case 'number':
									case 'integer':
										field.onChange(parseFloat(e.target.value));
										break;
									case 'checkbox':
										field.onChange(e.target.checked);
										break;
									case 'datetime-local':
									case 'date-time':
										field.onChange(dayjs(e.target.value).toISOString());
										break;
									default:
										field.onChange(e.target.value);
								}
							};

							let value;
							switch (type) {
								case 'date':
									value = field.value ? dayjs(field.value).format('YYYY-MM-DD') : '';
									break;
								case 'date-time':
								case 'datetime-local':
									value = field.value ? dayjs(field.value).format('YYYY-MM-DDTHH:mm') : '';
									break;
								default:
									value = field.value;
							}

							return (
								<>
									<input
										{...field}
										value={value}
										onChange={handleChange}
										type={inputType}
										autoComplete='on'
										data-testid={testId}
										disabled={disabled}
										className={clsx(
											'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
											{
												'ring-gray-300 focus:ring-indigo-600': !fieldState.error,
												'ring-red-500 focus:ring-red-500': fieldState.error,
												'bg-gray-200 cursor-not-allowed': disabled
											}
										)}
									/>
									<div className='text-red-500 mt-2 text-xs'>
										{fieldState.error ? fieldState.error.message : ''}
									</div>
								</>
							);
						}}
					/>
					<button type='button' onClick={() => remove(index)} className='ml-2 text-red-500'>
						Remove
					</button>
				</div>
			))}
			<button
				type='button'
				onClick={() => append(inputType === 'number' ? { value: 0 } : '')}
				className='mt-2 text-blue-500'
			>
				Add
			</button>
		</div>
	);
};

export default ArrayField;
