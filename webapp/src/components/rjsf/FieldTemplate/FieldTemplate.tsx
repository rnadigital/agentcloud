import {
	InformationCircleIcon,
} from '@heroicons/react/20/solid';
import {
	FieldTemplateProps,
	FormContextType,
	getTemplate,
	getUiOptions,
	RJSFSchema,
	StrictRJSFSchema,
} from '@rjsf/utils';
import dynamic from 'next/dynamic';
// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});
import rehypeRaw from 'rehype-raw';

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
	id,
	children,
	displayLabel,
	rawErrors = [],
	errors,
	help,
	description,
	rawDescription,
	classNames,
	style,
	disabled,
	label,
	hidden,
	onDropPropertyClick,
	onKeyChange,
	readonly,
	required,
	schema,
	uiSchema,
	registry,
}: FieldTemplateProps<T, S, F>) {
	const uiOptions = getUiOptions(uiSchema);
	const WrapIfAdditionalTemplate = getTemplate<
    'WrapIfAdditionalTemplate',
    T,
    S,
    F
  >('WrapIfAdditionalTemplate', registry, uiOptions);
	if (hidden) {
		return <div className='hidden'>{children}</div>;
	}
	return (
		<WrapIfAdditionalTemplate
			classNames={classNames}
			style={style}
			disabled={disabled}
			id={id}
			label={label}
			onDropPropertyClick={onDropPropertyClick}
			onKeyChange={onKeyChange}
			readonly={readonly}
			required={required}
			schema={schema}
			uiSchema={uiSchema}
			registry={registry}
		>
			<div>
				{displayLabel && (<>
					<label
						htmlFor={id}
						className={`mb-2 inline-block text-gray-900 text-sm ${
							rawErrors.length > 0 ? 'text-red-500' : ''
						}`}
					>
						{label}
						{required ? <span className='text-red-700'> *</span> : null}
					</label>
					{rawDescription && 
            <span className='tooltip text-sm ms-1 pt-1'>
        			<span className='text-gray-400 hover:text-gray-600 cursor-pointer'>
        				<InformationCircleIcon className='h-4 w-4' />
        			</span>
        			<span className='tooltiptext'>
        				<Markdown
        					rehypePlugins={[rehypeRaw as any]}
        					className={'markdown-content p-1'}
        				>
        					{rawDescription}
        				</Markdown>
        			</span>
        		</span>
					}
				</>)}
				{children}
				{errors}
				{help}
			</div>
		</WrapIfAdditionalTemplate>
	);
}
