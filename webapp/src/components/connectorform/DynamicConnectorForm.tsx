import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import { Schema } from 'lib/types/connectorform/form';
import { useEffect, useState } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';

import AdditionalFields from './AdditionalFields';
import FormSection from './FormSection';

interface DynamicFormProps {
	schema: Schema;
	datasourcePost: (arg: any) => Promise<void>
	error?: string
}

const ISODatePattern = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$';
const ISODateSixPattern = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{6}Z$';

function findPattern(obj: any): 'ISODatePattern' | 'ISODateSixPattern' | null {
	if (typeof obj !== 'object' || obj === null) { 
		return null; 
	}

	for (const key in obj) {
		if (key === 'pattern') {
			switch (obj[key]) {
				case ISODatePattern:
					return 'ISODatePattern';
				case ISODateSixPattern:
					return 'ISODateSixPattern';
				default:
					return null;
			}
		}
		if (typeof obj[key] === 'object') {
			const result = findPattern(obj[key]);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

function updateDateStrings(obj: any, pattern: 'ISODatePattern' | 'ISODateSixPattern') {
	Object.keys(obj).forEach(key => {
		if (typeof obj[key] === 'object') {
			updateDateStrings(obj[key], pattern);
		} else if (typeof obj[key] === 'string') {
			switch (pattern) {
				case 'ISODatePattern':
					obj[key] = obj[key].replace(/\.000Z$/, 'Z');
					break;
				case 'ISODateSixPattern':
					obj[key] = obj[key].replace(/\.000Z$/, '.000000Z');
					break;
				default:
					break;
			}
		}
	});
}

const DynamicConnectorForm = ({ schema, datasourcePost, error }: DynamicFormProps) => {
	const { handleSubmit } = useFormContext();
	const [submitting, setSubmitting] = useState(false);
	console.log('schema', schema);

	const onSubmit = async (data: FieldValues) => {
		switch (findPattern(schema)) {
			case 'ISODatePattern':
				updateDateStrings(data, 'ISODatePattern');
				break;
			case 'ISODateSixPattern':
				updateDateStrings(data, 'ISODateSixPattern');
				break;
			default:
				break;
		}

		setSubmitting(true);
		await datasourcePost(data);
		setSubmitting(false);
	};

	useEffect(() => {
		if (schema) {
			setSubmitting(false);
		}
	}, [schema]);

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<FormSection properties={schema.properties} requiredFields={schema.required} />
			{schema.additionalProperties && <AdditionalFields />}

			{error && <div className='mb-4'><ErrorAlert error={error} /></div>}
			<button
				disabled={submitting}
				type='submit'
				className='w-full rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				{submitting && <ButtonSpinner />}
				{submitting ? 'Testing connection...' : 'Submit'}
			</button>
		</form>
	);
};

export default DynamicConnectorForm;

