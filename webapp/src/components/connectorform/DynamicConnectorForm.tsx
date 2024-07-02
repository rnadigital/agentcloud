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

function findPattern(obj: any): 'pattern1' | 'pattern2' | null {
	if (typeof obj !== 'object' || obj === null) { return null; }

	for (const key in obj) {
		if (key === 'pattern') {

			if (obj[key] === ISODatePattern) {
				return 'pattern1';
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

function updateDateStrings(obj: any) {
	Object.keys(obj).forEach(key => {
		if (typeof obj[key] === 'object') {
			updateDateStrings(obj[key]);
		} else if (typeof obj[key] === 'string') {
			obj[key] = obj[key].replace(/\.000Z$/, 'Z');
		}
	});
}

const DynamicConnectorForm = ({ schema, datasourcePost, error }: DynamicFormProps) => {
	const { handleSubmit } = useFormContext();
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (data: FieldValues) => {

		// updateDateStrings(req.body.sourceConfig);
		if (findPattern(schema) === 'pattern1') {
			updateDateStrings(data);
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

