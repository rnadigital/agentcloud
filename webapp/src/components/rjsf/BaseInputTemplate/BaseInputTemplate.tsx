import {
	ariaDescribedByIds,
	BaseInputTemplateProps,
	examplesId,
	FormContextType,
	getInputProps,
	RJSFSchema,
	StrictRJSFSchema,
} from '@rjsf/utils';
import { ChangeEvent, FocusEvent } from 'react';

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
	id,
	placeholder,
	required,
	readonly,
	disabled,
	type,
	value,
	onChange,
	onChangeOverride,
	onBlur,
	onFocus,
	autofocus,
	options,
	schema,
	rawErrors = [],
	children,
	extraProps,
}: BaseInputTemplateProps<T, S, F>) {
	const inputProps = {
		...extraProps,
		...getInputProps<T, S, F>(schema, type, options),
	};
	const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
		onChange(value === '' ? options.emptyValue : value);
	const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
		onBlur(id, value);
	const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
		onFocus(id, value);
// className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'

	const inputClass = `
	block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white
    ${rawErrors.length > 0 ? 'border-red-500' : 'border-muted-foreground'}
  `;
	if (schema.const && !value) {
		const changeFunc = onChangeOverride || _onChange;
		changeFunc({ target: { value: schema.const } });
	}
	return (
		<>
			<input
				id={id}
				name={id}
				type={type}
				placeholder={placeholder}
				autoFocus={autofocus}
				required={required}
				disabled={disabled}
				readOnly={readonly || schema.const}
				className={inputClass}
				list={schema.examples ? examplesId<T>(id) : undefined}
				{...inputProps}
				value={schema.const ? schema.const : (value || value === 0 ? value : '')}
				onChange={onChangeOverride || _onChange}
				onBlur={_onBlur}
				onFocus={_onFocus}
				aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
			/>
			{children}
			{Array.isArray(schema.examples) ? (
				<datalist id={examplesId<T>(id)}>
					{(schema.examples as string[])
						.concat(
							schema.default && !schema.examples.includes(schema.default)
								? ([schema.default] as string[])
								: [],
						)
						.map((example: any) => {
							return <option key={example} value={example} />;
						})}
				</datalist>
			) : null}
		</>
	);
}
