import { XCircleIcon } from '@heroicons/react/20/solid';

interface ErrorAlertProps {
	error: string;
}

export default function ErrorAlert({ error }: ErrorAlertProps) {
	return (
		error && (
			<div className='rounded-md bg-destructive/10 p-4'>
				<div className='flex'>
					<div className='flex-shrink-0'>
						<XCircleIcon className='h-5 w-5 text-destructive' aria-hidden='true' />
					</div>
					<div className='ml-3'>
						<p className='text-sm font-medium text-destructive break-all'>{error}</p>
					</div>
				</div>
			</div>
		)
	);
}
