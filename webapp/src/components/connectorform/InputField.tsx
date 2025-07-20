import { InformationCircleIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import ToolTip from 'components/shared/ToolTip';
import dayjs from 'dayjs';
import cn from 'utils/cn';
import { ChangeEvent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FormFieldProps } from 'struct/form';
import { capitalize } from 'utils/capitalize';
import { toSentenceCase } from 'utils/tosentencecase';

const InputField = ({ name, testId, type, disabled, property, isRequired }: FormFieldProps) => {
	const { control } = useFormContext();

	return (
		<Controller
			name={name}
			control={control}
			rules={{
				required:
					isRequired && `${property.title ? property.title : toSentenceCase(name)} is required.`
			}}
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
						<input
							{...field}
							name={name}
							type={type}
							autoComplete='on'
							data-testid={testId}
							disabled={disabled}
							onChange={handleChange}
							value={value}
							className={cn(
								type !== 'checkbox' &&
									'mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-2 dark:bg-transparent  dark:text-gray-50',
								{
									'ring-gray-300 focus:ring-indigo-600 dark:ring-gray-600': !fieldState.error,
									'ring-red-500 focus:ring-red-500': fieldState.error,
									'bg-gray-200 cursor-not-allowed': disabled,
									'appearance-none': type === 'date', // Add this line
									'h-5 align-left w-5 mt-2': type === 'checkbox' // Add this line
								}
							)}
						/>
						<div className='text-red-500 mt-2 text-xs'>
							{fieldState.error && capitalize(fieldState.error.message)}
						</div>
					</div>
				);
			}}
		/>
	);
};

export default InputField;
