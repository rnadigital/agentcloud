import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';
import React from 'react';

export default function StepperCreateSource() {
	return (
		<div className='flex flex-col gap-4 text-sm'>
			<div>
				<p className='font-semibold'>Main Python Code</p>
				<p>
					Write the core logic of your custom tool here. This script will handle the main operations
					and data processing.
				</p>
			</div>
			<div className='flex flex-col gap-2'>
				<p className='font-semibold'>Runtime</p>
				<Select>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Version' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='python-3-12'>Python 3.12</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className='bg-gray-800 w-full min-h-[300px] rounded-lg'></div>
		</div>
	);
}
