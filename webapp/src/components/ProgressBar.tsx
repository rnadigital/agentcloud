import { PlusIcon } from '@heroicons/react/20/solid';
import React from 'react';

interface ProgressBarProps {
	max: number;
	filled: number;
	text: string;
	numberText?: string;
	cta?: null | string;
}

const ProgressBar: React.FC<ProgressBarProps> = function ({
	max,
	filled,
	text,
	numberText = text,
	cta
}) {
	const percentage = (filled / max) * 100;
	const maxFixed = max % 1 == 0 ? 0 : 3;
	const filledFixed = filled % 1 === 0 ? 0 : 3;
	const percentageFixed = percentage % 1 === 0 ? 0 : 2;

	return (
		<div className='border-2 rounded-lg shadow-md'>
			<div className='mx-4 my-6'>
				<h4 className='sr-only'>Status</h4>
				<div className='flex flex-row justify-between'>
					<p className='text-lg font-bold text-gray-900'>{text}</p>
					{cta && (
						<button
							type='reset'
							className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
							onClick={() => {}}
						>
							{cta}
						</button>
					)}
				</div>
				<div aria-hidden='true' className='mt-6'>
					<div className='overflow-hidden rounded-full bg-gray-200'>
						<div
							style={{ width: percentage.toString() + '%' }}
							className='h-2 rounded-full bg-indigo-600'
						/>
					</div>
					<div className='mt-6 hidden grid-cols-4 text-sm font-medium text-gray-600 sm:grid'>
						<div className='text-indigo-600'>
							{'Currently Used: ' +
								filled.toFixed(filledFixed) +
								' ' +
								numberText +
								' / ' +
								percentage.toFixed(percentageFixed) +
								'% used'}
						</div>
						<div className='text-center text-indigo-600'></div>
						<div className='text-center'></div>
						<div className='text-right'>
							{'Maximum Available: ' + max.toFixed(maxFixed) + ' ' + numberText}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProgressBar;
