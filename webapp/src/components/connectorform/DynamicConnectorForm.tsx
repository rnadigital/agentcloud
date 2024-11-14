import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { Schema } from 'struct/form';

import AdditionalFields from './AdditionalFields';
import FormSection from './FormSection';

interface DynamicFormProps {
	schema: Schema;
	datasourcePost: (arg: any) => Promise<void>;
	error?: string;
}

const ISODatePattern = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$';
const ISODateSixPattern = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{6}Z$';
const ISODatePattern2 = '^([0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}Z)?)$';
const DatePattern = '^[0-9]{2}-[0-9]{2}-[0-9]{4}$';
const YYYYMMDDPattern = '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';

function findPatterns(obj: any): {
	[key: string]: 'ISODatePattern' | 'ISODateSixPattern' | 'DatePattern' | 'YYYYMMDDPattern';
} {
	const foundPatterns: {
		[key: string]: 'ISODatePattern' | 'ISODateSixPattern' | 'DatePattern' | 'YYYYMMDDPattern';
	} = {};

	function search(obj: any, parentKey: string = '') {
		if (typeof obj !== 'object' || obj === null) {
			return;
		}

		for (const key in obj) {
			if (key === 'properties') {
				search(obj[key], parentKey);
				continue;
			}
			const currentKey = parentKey ? `${parentKey}.${key}` : key;
			if (key === 'pattern') {
				switch (obj[key]) {
					case YYYYMMDDPattern:
						foundPatterns[parentKey] = 'YYYYMMDDPattern';
						break;
					case DatePattern:
						foundPatterns[parentKey] = 'DatePattern';
						break;
					case ISODatePattern:
					case ISODatePattern2:
						foundPatterns[parentKey] = 'ISODatePattern';
						break;
					case ISODateSixPattern:
						foundPatterns[parentKey] = 'ISODateSixPattern';
						break;
					default:
						break;
				}
			}
			if (typeof obj[key] === 'object') {
				search(obj[key], currentKey);
			}
		}
	}

	search(obj);
	return foundPatterns;
}

function updateDateStrings(
	obj: any,
	patterns: {
		[key: string]: 'ISODatePattern' | 'ISODateSixPattern' | 'DatePattern' | 'YYYYMMDDPattern';
	},
	parentKey: string = ''
) {
	Object.keys(obj).forEach(key => {
		const currentKey = parentKey ? `${parentKey}.${key}` : key;
		if (typeof obj[key] === 'object') {
			updateDateStrings(obj[key], patterns, currentKey);
		} else if (typeof obj[key] === 'string') {
			const pattern = patterns[currentKey];
			switch (pattern) {
				case 'YYYYMMDDPattern':
					obj[key] = dayjs(obj[key]).format('YYYY-MM-DD');
					break;
				case 'DatePattern':
					obj[key] = dayjs(obj[key]).format('DD-MM-YYYY');
					break;
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

	const onSubmit = async (data: FieldValues) => {
		const patterns = findPatterns(schema.properties);
		updateDateStrings(data, patterns);

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

			{error && (
				<div className='mb-4'>
					<ErrorAlert error={error} />
				</div>
			)}
			<button
				className='bg-white w-fit flex p-4 items-center px-5 py-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white rounded-md ml-auto'
				type='submit'
				disabled={submitting}
			>
				{submitting && <ButtonSpinner />}
				{submitting ? 'Testing connection...' : 'Connect'}
			</button>
		</form>
	);
};

export default DynamicConnectorForm;
