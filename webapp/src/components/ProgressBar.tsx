import React from 'react';

interface ProgressBarProps {
	max: number;
	filled: number;
	text: string;
	numberText?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = function ({
	max,
	filled,
	text,
	numberText = text
}) {
	const percentage = (filled / max) * 100;

	return (
		<div className='border-2 rounded-lg shadow-md'>
			<div className='mx-4 my-6'>
				<h4 className='sr-only'>Status</h4>
				<p className='text-lg font-bold text-gray-900'>{text}</p>
				<div aria-hidden='true' className='mt-6'>
					<div className='overflow-hidden rounded-full bg-gray-200'>
						<div
							style={{ width: percentage.toString() + '%' }}
							className='h-2 rounded-full bg-indigo-600'
						/>
					</div>
					<div className='mt-6 hidden grid-cols-4 text-sm font-medium text-gray-600 sm:grid'>
						<div className='text-indigo-600'>
							{'Currently Used: ' + filled.toString() + ' ' + numberText}
						</div>
						<div className='text-center text-indigo-600'></div>
						<div className='text-center'></div>
						<div className='text-right'>
							{'Maximum Available: ' + max.toString() + ' ' + numberText}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProgressBar;
