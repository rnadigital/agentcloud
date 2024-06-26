import { InformationCircleIcon } from '@heroicons/react/20/solid';

export default function InfoAlert({ message, textColor='blue', className=null }: { message: any, textColor?: string, className?: string }) {
	return message && (
	    <div className={className || 'rounded-md bg-blue-100 p-4 mb-2'}>
			<div className='flex'>
				<div className='flex-shrink-0'>
					<InformationCircleIcon className={`h-5 w-5 text-${textColor}-400`} aria-hidden='true' />
				</div>
				<div className='ml-3'>
					<h3 className={`text-sm font-medium text-${textColor}-800`}>{message}</h3>
				</div>
			</div>
		</div>
	);
}
