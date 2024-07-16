import clsx from 'clsx';
import { Control, Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { capitalizeFirstLetter } from 'utils/capitalizeFirstLetter';

interface FormFieldProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    rules: RegisterOptions<TFieldValues>
    label?: string;
    type: string;
    control?: Control<TFieldValues>;
    disabled?: boolean;
}

const InputField = <TFieldValues extends FieldValues>({
	name,
	rules,
	label,
	type,
	disabled,
	control
}: FormFieldProps<TFieldValues>) => {

    // const { control } = useFormContext<TFieldValues>();

	return (
		<Controller
			name={name}
			control={control}
			rules={rules}
			render={({ field, fieldState }) => {

				return (
					<div className='flex flex-col justify-center'>
						{label && <div className='flex items-center'>
							<label htmlFor={name} className='mr-1 mb-2 text-sm'>
								{label}
							</label>
						</div>}
						<input
							{...field}
							name={name}
							type={type}
							autoComplete='on'
							disabled={disabled}
							className={clsx('bg-gray-50 rounded-lg border border-gray-300 w-full h-10 p-1 pl-3 text-gray-500',
								type === 'checkbox' && 'h-4 rounded-none cursor-pointer' )}
						/>
						{type !== 'checkbox' && <div className='text-red-500 mt-2 text-xs'>
							{fieldState.error && capitalizeFirstLetter(fieldState.error.message)}
						</div>}
					</div>
				);
			}}
		/>
	);
};

export default InputField;