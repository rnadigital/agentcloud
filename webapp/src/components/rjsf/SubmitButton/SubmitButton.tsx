import {
	FormContextType,
	getSubmitButtonOptions,
	RJSFSchema,
	StrictRJSFSchema,
	SubmitButtonProps,
} from '@rjsf/utils';

export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: SubmitButtonProps<T, S, F>) {
	const {
		submitText,
		norender,
		props: submitButtonProps,
	} = getSubmitButtonOptions<T, S, F>(props.uiSchema);

	if (norender) {
		return null;
	}

	return (
		<div>
			<button
				type='submit'
				className='rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				{...submitButtonProps}
			>
				{submitText}
			</button>
		</div>
	);
}
