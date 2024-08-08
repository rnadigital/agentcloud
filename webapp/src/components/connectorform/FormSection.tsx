import clsx from 'clsx';
import { Schema } from 'struct/form';

import FormField from './FormField';

interface FormSectionProps {
	properties?: Schema['properties'];
	name?: string;
	requiredFields?: string[];
	level?: number;
}

const FormSection = ({ properties, name, requiredFields, level = 0 }: FormSectionProps) => {
	if (!properties) {
		return null;
	}

	const sortedEntries = Object.entries(properties).sort(([_, a], [__, b]) => {
		const orderA = a.order !== undefined ? a.order : Infinity;
		const orderB = b.order !== undefined ? b.order : Infinity;
		return orderA - orderB;
	});

	return (
		<div
			className={clsx({
				'ml-4 border p-2': level === 1,
				'ml-8 border p-2 ': level === 2,
				'ml-12 border p-2': level >= 3
			})}
		>
			<div className='font-semibold capitalize my-2 text-sm dark:text-slate-400'>{name}</div>

			{sortedEntries.map(([fieldName, fieldSchema]) => {
				return (
					<div key={name ? `${name}.${fieldName}` : fieldName}>
						<FormField
							name={name ? `${name}.${fieldName}` : fieldName}
							property={fieldSchema}
							requiredFields={requiredFields}
							level={level + 1}
						/>
					</div>
				);
			})}
		</div>
	);
};

export default FormSection;
