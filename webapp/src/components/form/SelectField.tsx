import { InformationCircleIcon } from '@heroicons/react/24/outline';
import ToolTip from 'components/shared/ToolTip';
import React from 'react';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import Select from 'react-tailwindcss-select';
import { Option } from 'react-tailwindcss-select/dist/components/type';

interface SelectFieldProps<TFieldValues extends FieldValues> {
	name: Path<TFieldValues>;
	rules: RegisterOptions<TFieldValues>;
	label?: string;
	control?: Control<TFieldValues>;
	disabled?: boolean;
	placeholder?: string;
	value?: string;
	isRequired?: boolean;
	description?: string;
	isMultiple?: boolean;
	options: Option[];
	optionLabel?: (option: Option) => JSX.Element;
}

const SelectField = <TFieldValues extends FieldValues>({
	name,
	rules,
	label,
	disabled,
	control,
	placeholder,
	value,
	isRequired,
	description,
	isMultiple,
	options,
	optionLabel
}: SelectFieldProps<TFieldValues>) => {
	return (
		<div className='w-full'>
			<div className='flex items-center'>
				{label && (
					<label htmlFor={label} className='mr-1 text-sm dark:text-slate-400'>
						{label}
						{isRequired && <span className='text-red-500 ml-1 align-super'>*</span>}
					</label>
				)}

				{description && (
					<ToolTip content={description} allowHTML interactive>
						<div className='cursor-pointer'>
							<InformationCircleIcon className='h-4 w-4' />
						</div>
					</ToolTip>
				)}
			</div>

			<div className='mt-2'>
				<Controller
					name={name}
					control={control}
					rules={rules}
					render={({ field, fieldState }) => {
						const handleChange = selected => {
							if (isMultiple) {
								const s = selected?.map(o => o.value);
								return field.onChange(s);
							}
							field.onChange(selected.value);
						};

						const value = !isMultiple
							? options.find(o => o.value === field.value)
							: options.filter(o => (field?.value ?? []).includes(o.value));

						return (
							<>
								<Select
									{...field}
									placeholder={placeholder}
									primaryColor='inigo'
									options={options.filter(a => a.value && a.label)}
									isMultiple={isMultiple}
									isDisabled={disabled}
									onChange={handleChange}
									value={value}
									classNames={{
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-transparent dark:border-slate-600 cursor-pointer',
										menuButton: () =>
											'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-transparent dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 cursor-pointer',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) =>
											`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-slate-600 dark:text-gray-50 dark:hover:text-white`
									}}
									formatOptionLabel={optionLabel}
								/>
								<div className='text-red-500 mt-2 text-xs'>
									{fieldState.error ? fieldState.error.message : ''}
								</div>
							</>
						);
					}}
				/>
			</div>
		</div>
	);
};

export default SelectField;
