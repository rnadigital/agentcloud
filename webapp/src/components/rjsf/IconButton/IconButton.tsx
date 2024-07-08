import {
	ArrowDownIcon,
	ArrowUpIcon,
	ClipboardIcon,
	XMarkIcon,
} from '@heroicons/react/20/solid';
import {
	FormContextType,
	IconButtonProps,
	RJSFSchema,
	StrictRJSFSchema,
	TranslatableString,
} from '@rjsf/utils';

export default function IconButton<
	T = any,
	S extends StrictRJSFSchema = RJSFSchema,
	F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
	const {
		icon,
		iconType,
		className,
		uiSchema,
		registry,
		disabled,
		...otherProps
	} = props;
	const buttonClass = iconType === 'block' ? 'w-full' : '';
	const variantClass =
		// @ts-expect-error incomplete type from rjsf
		props.variant === 'danger'
			? 'bg-red-500 hover:bg-red-700 text-white'
			: disabled
				? 'bg-gray-100 text-gray-300'
				: 'bg-gray-200 hover:bg-gray-500 text-gray-700';

	return (
		<button
			className={`rounded grid justify-items-center px-4 py-2 text-base font-normal ${buttonClass} ${variantClass} ${className}`}
			{...otherProps}
		>
			{icon}
		</button>
	);
}

export function CopyButton<
	T = any,
	S extends StrictRJSFSchema = RJSFSchema,
	F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
	const {
		registry: { translateString },
	} = props;
	return (
		<IconButton
			title={translateString(TranslatableString.CopyButton)}
			{...props}
			icon={<ClipboardIcon className='h-4' />}
		/>
	);
}

export function MoveDownButton<
	T = any,
	S extends StrictRJSFSchema = RJSFSchema,
	F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
	const {
		registry: { translateString },
	} = props;
	return (
		<IconButton
			className='mx-1'
			title={translateString(TranslatableString.MoveDownButton)}
			{...props}
			icon={<ArrowDownIcon className='h-4' />}
		/>
	);
}

export function MoveUpButton<
	T = any,
	S extends StrictRJSFSchema = RJSFSchema,
	F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
	const {
		registry: { translateString },
	} = props;
	return (
		<IconButton
			title={translateString(TranslatableString.MoveUpButton)}
			{...props}
			icon={<ArrowUpIcon className='h-4' />}
		/>
	);
}

export function RemoveButton<
	T = any,
	S extends StrictRJSFSchema = RJSFSchema,
	F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
	const {
		registry: { translateString },
	} = props;
	return (
		<IconButton
			title={translateString(TranslatableString.RemoveButton)}
			{...props}
			// @ts-expect-error incomplete props from rjsf
			variant='danger'
			icon={<XMarkIcon className='h-4' />}
		/>
	);
}
