import { InformationCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import ToolTip from 'components/shared/ToolTip';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormFieldProps } from 'struct/form';
import { toSentenceCase } from 'utils/tosentencecase';

import FormSection from './FormSection';

const ObjectArrayField = ({ name, property, level = 0, isRequired }: FormFieldProps) => {
	const { control } = useFormContext();

	const { fields, append, remove } = useFieldArray({
		control,
		name
	});

	return (
		<div className='flex flex-col'>
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
				<div key={field.id} className='flex flex-col mt-2'>
					<button
						type='button'
						onClick={() => remove(index)}
						className='text-white bg-red-500 border w-fit p-1 ml-auto mr-2 mb-2 rounded-md'
					>
						<XMarkIcon className='h-4 w-4' />
					</button>
					<FormSection
						properties={property.items.properties}
						name={`${name}[${index}]`}
						level={level + 1}
						requiredFields={property.items.required}
					/>
				</div>
			))}
			<button
				type='button'
				onClick={() => append({})}
				className='text-white bg-indigo-500 border p-1 ml-auto mr-2 mt-2 rounded-md'
			>
				<PlusIcon className='h-4 w-4' />
			</button>
		</div>
	);
};

export default ObjectArrayField;
