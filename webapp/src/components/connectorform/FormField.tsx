import { Property } from 'lib/types/connectorform/form';
import { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { Option, SelectValue } from 'react-tailwindcss-select/dist/components/type';

import ArrayField from './ArrayField';
import FormSection from './FormSection';
import InputField from './InputField';
import MultiSelectField from './MultiSelectField';
import ObjectArrayField from './ObjectArrayField';

interface FormFieldProps {
    name: string;
    property: Property;
    requiredFields?: string[]
    level?: number
}

const FormField = ({ name, property, requiredFields, level = 0 }: FormFieldProps) => {

	const isRequired = requiredFields?.includes(name);

	const [selectedOption, setSelectedOption] = useState<Property>();

	const handleOptionChangeTwo = (e: SelectValue, oneOf?: Property[]) => {
		const selectedTitle = (e as Option).value;
		const selected = oneOf?.find(option => option.title === selectedTitle) || null;
		if (selected) {
			setSelectedOption(selected);
		}
	};

	switch (property.type) {
		case 'string':
			if (property?.format === 'date') {
				return <InputField property={property} name={name} type='date' isRequired={isRequired} />;
			}
			if (property?.format === 'date-time') {
				return <InputField property={property} name={name} type='datetime-local' isRequired={isRequired} />;
			}
			return <InputField property={property} name={name} type='text' isRequired={isRequired} />;

		case 'integer':
			return <InputField property={property} name={name} type='number' isRequired={isRequired} />;

		case 'boolean':
			return <InputField property={property} name={name} type='checkbox' isRequired={isRequired} />;

		case 'array':
			if (property.items.type === 'object') {
				return <ObjectArrayField property={property} name={name} type='object' level={level} />;
			}

			if (property.items?.enum && property.items.enum.length > 0) {
				const options = property.items.enum.map((item: string) => ({
					value: item,
					label: item,
				}));
				return (
					<MultiSelectField
						property={property}
						options={options}
						name={name}
						testId={name}
						type='text'
						isMultiple={!!property.minItems}
						isRequired={isRequired}
					/>
				);
			}
			return <ArrayField property={property} name={name} testId={name} type='text' />;

		case 'object':
			if (property.oneOf) {
				return <div>
					<h3> {property.title}</h3 >
					<Select
						primaryColor='inigo'
						options={property.oneOf.map((option: Property) => ({
							value: option.title || '',
							label: option.title || '',
						}))}
						onChange={(e) => handleOptionChangeTwo(e, property.oneOf)}
						value={{ value: selectedOption?.title || '', label: selectedOption?.title || '' }}
					/>

					{selectedOption?.properties && <FormSection properties={selectedOption.properties} requiredFields={selectedOption.required} />}
				</div >;
			}
			return <div>unknown</div>;

		default:
			return <div>unknown</div>;
	}
};

export default FormField;