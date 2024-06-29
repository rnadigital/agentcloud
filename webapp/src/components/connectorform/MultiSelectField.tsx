import { InformationCircleIcon } from '@heroicons/react/20/solid';
import ToolTip from 'components/shared/ToolTip';
import { FormFieldProps } from 'lib/types/connectorform/form';
import {
	Controller,
	useFormContext,
} from 'react-hook-form';
import Select from 'react-tailwindcss-select';
import { Option } from 'react-tailwindcss-select/dist/components/type';
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

	const { control, watch } = useFormContext();

	return <div>
		<div className='flex items-center'>
			<label htmlFor={name} className='mr-1'>
				{property.title ? property.title : toSentenceCase(name)}
				{isRequired && <span className='text-red-500 ml-1 align-super'>*</span>}
			</label>

			{property.description && <ToolTip content={property.description} allowHTML interactive>
				<div className='cursor-pointer'>
					<InformationCircleIcon className='h-4 w-4' />
				</div>
			</ToolTip>}
		</div>

		<div className='mt-2'>
			<Controller
				name={name}
				control={control}
				rules={{ required: isRequired && `${property.title ? property.title : toSentenceCase(name)} is required.` }}
				render={({ field, fieldState }) => {

					const handleChange = (selected) => {
						if (isMultiple) {
							const s = (selected as Option[]).map(o => o.value);
							return field.onChange(s);
						}
						field.onChange((selected as Option).value);
					};

					const value = !isMultiple ? options.find(o => o.value === field.value) : options.filter(o => (field?.value ?? []).includes(o.value));
					return (
						<>
							<Select
								{...field}
								primaryColor='inigo'
								options={options}
								isMultiple={isMultiple}
								isDisabled={disabled}
								onChange={handleChange}
								value={value}
							/>
							<div className='text-red-500 mt-2 text-xs'>
								{fieldState.error ? fieldState.error.message : ''}
							</div>
						</>
					);
				}}
			/>
		</div>
	</div>;
};

export default MultiSelectField;