import {
	DescriptionFieldProps,
	FormContextType,
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

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, description }: DescriptionFieldProps<T, S, F>) {
	if (description) {
		return (
			<div>
				<div id={id} className='mb-1'>
  				<Markdown
  					rehypePlugins={[rehypeRaw as any]}
  					className={'markdown-content text-sm'}
  				>
  					{description as any}
  				</Markdown>
				</div>
			</div>
		);
	}

	return null;
}
