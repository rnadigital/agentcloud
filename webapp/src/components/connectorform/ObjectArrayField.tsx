import { InformationCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import Tippy from '@tippyjs/react';
import { FormFieldProps } from 'lib/types/connectorform/form';
import {
	useFieldArray,
	useFormContext,
} from 'react-hook-form';
import { toSentenceCase } from 'utils/toSentenceCase';

import FormSection from './FormSection';

const ObjectArrayField = ({
	name,
	property,
	level = 0
}: FormFieldProps) => {
	const { control } = useFormContext();

	const { fields, append, remove } = useFieldArray({
		control,
		name,
	});

	return (
		<div className='flex flex-col'>
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
