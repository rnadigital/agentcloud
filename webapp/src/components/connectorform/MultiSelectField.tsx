import { InformationCircleIcon } from '@heroicons/react/20/solid';
import Tippy from '@tippyjs/react';
import { FormFieldProps } from 'lib/types/connectorform/form';
import {
	Controller,
	useFormContext,
} from 'react-hook-form';
import Select from 'react-tailwindcss-select';
import { toSentenceCase } from 'utils/toSentenceCase';

interface MultiSelectFieldProps extends FormFieldProps {
    options: { value: string; label: string }[];
    isMultiple?: boolean
}

const MultiSelectField = ({
	options,
	isMultiple,
	name,
	disabled,
	property,
	isRequired
}: MultiSelectFieldProps) => {

	const { control } = useFormContext();

	return <div>
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
		<div className='mt-2'>
			<Controller
				name={name}
				control={control}
				rules={{ required: isRequired && `${property.title ? property.title : toSentenceCase(name)} is required.` }}
				render={({ field, fieldState }) => (
					<>
						<Select
							{...field}
							primaryColor='inigo'
							options={options}
							isMultiple={isMultiple}
							isDisabled={disabled}
							onChange={(selected) => field.onChange(selected)}
							value={field.value}
						/>
						<div className='text-red-500 mt-2 text-xs'>
							{fieldState.error ? fieldState.error.message : ''}
						</div>
					</>
				)}
			/>
		</div>
	</div>;
};

export default MultiSelectField;