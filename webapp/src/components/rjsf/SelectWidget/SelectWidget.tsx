import {
	ariaDescribedByIds,
	enumOptionsIndexForValue,
	enumOptionsValueForIndex,
	FormContextType,
	RJSFSchema,
	StrictRJSFSchema,
	WidgetProps,
} from '@rjsf/utils';
import { ChangeEvent, FocusEvent, useEffect, useState } from 'react';

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
	schema,
	id,
	options,
	required,
	disabled,
	readonly,
	value,
	multiple,
	autofocus,
	onChange,
	onBlur,
	onFocus,
	placeholder,
	rawErrors = [],
}: WidgetProps<T, S, F>) {
	const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;

	const emptyValue = multiple ? [] : '';

	function getValue(event: FocusEvent | ChangeEvent | any, multiple?: boolean) {
		if (multiple) {
			return [].slice
				.call(event.target.options as any)
				.filter((o: any) => o.selected)
				.map((o: any) => o.value);
		} else {
			return event.target.value;
		}
	}
	const selectedIndexes = enumOptionsIndexForValue<S>(
		value,
		enumOptions,
		multiple,
	);

	const [readOnlyWhitelist, setReadOnlyWhitelist] = useState(false);
	useEffect(() => {
		const eoIndex = enumOptions.findIndex(eo => eo?.label?.includes('Document File Type Format')); //TODO: white whitelist system
		if (eoIndex !== -1) {
			setTimeout(() => {
				const newValue = getValue({ target: { value: String(eoIndex) }}, false);
				onChange(enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue));
				setReadOnlyWhitelist(true);
			}, 0);
		}
	}, []);

	return (
		<select
			id={id}
			name={id}
			value={
				typeof selectedIndexes === 'undefined' ? emptyValue : selectedIndexes
			}
			required={required}
			multiple={multiple}
			disabled={disabled || readonly || readOnlyWhitelist}
			autoFocus={autofocus}
			className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white
      ${rawErrors.length > 0 ? 'border-red-500' : 'border-muted'}
      `}
			onBlur={
				onBlur &&
        ((event: FocusEvent) => {
        	const newValue = getValue(event, multiple);
        	onBlur(
        		id,
        		enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue),
        	);
        })
			}
			onFocus={
				onFocus &&
        ((event: FocusEvent) => {
        	const newValue = getValue(event, multiple);
        	onFocus(
        		id,
        		enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue),
        	);
        })
			}
			onChange={(event: ChangeEvent) => {
				const newValue = getValue(event, multiple);
				onChange(
					enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyValue),
				);
			}}
			aria-describedby={ariaDescribedByIds<T>(id)}
		>
			{!multiple && schema.default === undefined && (
				<option value='' className='bg-muted'>
					{placeholder}
				</option>
			)}
			{(enumOptions as any).map(({ value, label }: any, i: number) => {
				const disabled: any =
          Array.isArray(enumDisabled) &&
          (enumDisabled as any).indexOf(value) != -1;
				return (
					<option
						key={i}
						id={label}
						value={String(i)}
						disabled={disabled}
						className='bg-muted'
					>
						{label}
					</option>
				);
			})}
		</select>
	);
}
