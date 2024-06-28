import { InformationCircleIcon } from '@heroicons/react/20/solid';
import Tippy from '@tippyjs/react';
import clsx from 'clsx';
import { FormFieldProps } from 'lib/types/connectorform/form';
import {
	Controller,
	useFieldArray,
	useFormContext,
} from 'react-hook-form';
import { toSentenceCase } from 'utils/toSentenceCase';

const ArrayField = ({
	name,
	testId,
	type,
	disabled,
	property,
}: FormFieldProps) => {
	const { control } = useFormContext();
	const { fields, append, remove } = useFieldArray({
		control,
		name,
	});

	return (
		<div>
			<div className='flex items-center'>
				<label htmlFor={name} className='mr-1'>
					{property.title ? property.title : toSentenceCase(name)}
				</label>
				<Tippy content={property.description}>
					<div className='cursor-pointer'>
						<InformationCircleIcon className='h-4 w-4' />
					</div>
				</Tippy>
			</div>
			{fields.map((field, index) => (
				<div key={field.id} className='flex items-center mt-2'>
					<Controller
						name={`${name}[${index}].value`}
						control={control}
						render={({ field, fieldState }) => (
							<>
								<input
									{...field}
									type={type}
									autoComplete='on'
									data-testid={testId}
									disabled={disabled}
									className={clsx(
										'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
										{
											'ring-gray-300 focus:ring-indigo-600': !fieldState.error,
											'ring-red-500 focus:ring-red-500': fieldState.error,
											'bg-gray-200 cursor-not-allowed': disabled,
										},
									)}
								/>
								<div className='text-red-500 mt-2 text-xs'>
									{fieldState.error ? fieldState.error.message : ''}
								</div>
							</>
						)}
					/>
					<button
						type='button'
						onClick={() => remove(index)}
						className='ml-2 text-red-500'
					>
                        Remove
					</button>
				</div>
			))}
			<button
				type='button'
				onClick={() => append({ value: '' })}
				className='mt-2 text-blue-500'
			>
                Add
			</button>
		</div>
	);
};

export default ArrayField;
