import { InformationCircleIcon } from '@heroicons/react/20/solid';

export default function InfoAlert({ message, color='blue' }: { message: string, color?: string; }) {
	return message && (
	    <div className={`rounded-md bg-${color}-50 p-4`}>
			<div className='flex'>
				<div className='flex-shrink-0'>
					<InformationCircleIcon className={`h-5 w-5 text-${color}-400`} aria-hidden='true' />
				</div>
				<div className='ml-3'>
					<h3 className={`text-sm font-medium text-${color}-800`}>{message}</h3>
				</div>
			</div>
		</div>
	);
}
