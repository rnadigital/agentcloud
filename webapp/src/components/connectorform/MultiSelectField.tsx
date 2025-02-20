import { InformationCircleIcon } from '@heroicons/react/20/solid';
import ToolTip from 'components/shared/ToolTip';
import Spinner from 'components/Spinner';
import { Controller, useFormContext } from 'react-hook-form';
import Select from 'react-tailwindcss-select';
import { Option } from 'react-tailwindcss-select/dist/components/type';
import { FormFieldProps } from 'struct/form';
import { toSentenceCase } from 'utils/tosentencecase';

interface MultiSelectFieldProps extends FormFieldProps {
	options: { value: string; label: string }[];
	isMultiple?: boolean;
}

const MultiSelectField = ({
	options,
	isMultiple,
	name,
	disabled,
	property,
	isRequired
}: MultiSelectFieldProps) => {
	const { control, watch } = useFormContext();

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

			<div className='mt-2'>
				<Controller
					name={name}
					control={control}
					rules={{
						required:
							isRequired && `${property.title ? property.title : toSentenceCase(name)} is required.`
					}}
					render={({ field, fieldState }) => {
						const handleChange = selected => {
							if (isMultiple) {
								const s = (selected as Option[])?.map(o => o.value);
								return field.onChange(s);
							}
							field.onChange((selected as Option).value);
						};

						const value = !isMultiple
							? options.find(o => o.value === field.value)
							: options.filter(o => (field?.value ?? []).includes(o.value));
						return (
							<>
								<Select
									{...field}
									primaryColor='inigo'
									options={options.filter(a => a.value && a.label)}
									isMultiple={isMultiple}
									isDisabled={disabled}
									onChange={handleChange}
									value={value}
									classNames={{
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-transparent dark:border-slate-600',
										menuButton: () =>
											'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-transparent dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) =>
											`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-slate-600 dark:text-gray-50 dark:hover:text-white`
									}}
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

export default MultiSelectField;
