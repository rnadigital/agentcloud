import {
	FormContextType,
	IconButtonProps,
	RJSFSchema,
	StrictRJSFSchema,
	TranslatableString,
} from '@rjsf/utils';

export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ uiSchema, registry, ...props }: IconButtonProps<T, S, F>) {
	const { translateString } = registry;
	return (
		<button
			{...props}
			className={`flex items-center rounded bg-indigo-600 py-1 px-2.5 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${props.className}`}
			title={translateString(TranslatableString.AddItemButton)}
		>
+
		</button>
	);
}
