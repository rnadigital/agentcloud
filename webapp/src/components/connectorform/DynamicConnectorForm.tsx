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

const DynamicConnectorForm = ({ schema, datasourcePost, error }: DynamicFormProps) => {
	console.log(schema);
	const { handleSubmit, unregister, reset } = useFormContext();
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = (data: FieldValues) => {
		setSubmitting(true);
		console.log(data);

		datasourcePost(data);
		setSubmitting(false);
	};

	useEffect(() => {
		Object.keys(schema.properties).forEach((key) => unregister(key));
		reset();
	}, [schema, reset, unregister]);

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