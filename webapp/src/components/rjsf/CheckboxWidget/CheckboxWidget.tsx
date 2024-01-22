import {
	InformationCircleIcon,
} from '@heroicons/react/20/solid';
import {
	ariaDescribedByIds,
	descriptionId,
	FormContextType,
	getTemplate,
	labelValue,
	RJSFSchema,
	schemaRequiresTrueValue,
	StrictRJSFSchema,
	WidgetProps,
} from '@rjsf/utils';
import dynamic from 'next/dynamic';
import { FocusEvent } from 'react';
// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});
import rehypeRaw from 'rehype-raw';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
	const {
		id,
		value,
		disabled,
		readonly,
		label,
		hideLabel,
		schema,
		autofocus,
		options,
		onChange,
		onBlur,
		onFocus,
		registry,
		uiSchema,
	} = props;
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
	const required = schemaRequiresTrueValue<S>(schema);
	const DescriptionFieldTemplate = getTemplate<
    'DescriptionFieldTemplate',
    T,
    S,
    F
  >('DescriptionFieldTemplate', registry, options);

	const _onChange = ({ target: { checked } }: FocusEvent<HTMLInputElement>) =>
		onChange(checked);
	const _onBlur = ({ target: { checked } }: FocusEvent<HTMLInputElement>) =>
		onBlur(id, checked);
	const _onFocus = ({ target: { checked } }: FocusEvent<HTMLInputElement>) =>
		onFocus(id, checked);

	const description = options.description || schema.description;
	return (
		<div
			className={`relative ${
				disabled || readonly ? 'cursor-not-allowed opacity-50' : ''
			}`}
			aria-describedby={ariaDescribedByIds<T>(id)}
		>
			<label className='mt-4 block text-sm'>
				<input
					id={id}
					name={id}
					type='checkbox'
					checked={typeof value === 'undefined' ? false : value}
					required={required}
					disabled={disabled || readonly}
					autoFocus={autofocus}
					onChange={_onChange}
					onBlur={_onBlur}
					onFocus={_onFocus}
					className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600 mb-1'
				/>
				<span className='ml-2'>
					{labelValue(label, hideLabel || !label)}
					{!hideLabel && !!description && <span className='tooltip'>
      			<span className='text-gray-400 hover:text-gray-600 cursor-pointer'>
      				<InformationCircleIcon className='ms-1 h-4 w-4' />
      			</span>
      			<span className='tooltiptext'>
      				<Markdown
      					rehypePlugins={[rehypeRaw as any]}
      					className={'markdown-content'}
      				>
      					{description}
      				</Markdown>
      			</span>
      		</span>}
				</span>
			</label>
		</div>
	);
}
