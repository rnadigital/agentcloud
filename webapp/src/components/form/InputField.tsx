import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useState } from 'react';
import {
	Control,
	Controller,
	FieldValues,
	Path,
	RegisterOptions,
	useFormContext
} from 'react-hook-form';
import { capitalize } from 'utils/capitalize';

interface FormFieldProps<TFieldValues extends FieldValues> {
	name: Path<TFieldValues>;
	rules: RegisterOptions<TFieldValues>;
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
	const [showPassword, setShowPassword] = useState(false);

	return (
		<Controller
			name={name}
			control={control}
			rules={rules}
			render={({ field, fieldState }) => {
				return (
					<div className='flex flex-col justify-center'>
						{label && (
							<div className='flex items-center'>
								<label htmlFor={name} className='mr-1 mb-2 text-sm'>
									{label}
								</label>
							</div>
						)}
						<div className='relative'>
							<input
								{...field}
								name={name}
								type={showPassword ? 'text' : type}
								autoComplete='on'
								disabled={disabled}
								className={clsx(
									'bg-gray-50 rounded-lg border border-gray-300 w-full h-10 p-1 pl-3 text-gray-500',
									type === 'checkbox' && 'h-4 rounded-none cursor-pointer'
								)}
							/>

							{type === 'password' && (
								<div
									onClick={() => setShowPassword(o => !o)}
									className='cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3'
								>
									{showPassword ? (
										<EyeIcon className='h-4 w-4 text-gray-400' aria-hidden='true' />
									) : (
										<EyeSlashIcon className='h-4 w-4 text-gray-400' aria-hidden='true' />
									)}
								</div>
							)}
						</div>
						{type !== 'checkbox' && (
							<div className='text-red-500 mt-2 text-xs'>
								{fieldState.error && capitalize(fieldState.error.message)}
							</div>
						)}
					</div>
				);
			}}
		/>
	);
};

export default InputField;
