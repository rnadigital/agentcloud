import ButtonSpinner from 'components/ButtonSpinner';
import React from 'react';

interface LoadingBarProps {
	total?: number;
	success?: number;
	failure?: number;
	text?: string;
}

const LoadingBar: React.FC<LoadingBarProps> = function ({
	total = null,
	success = 0,
	failure = 0,
	text = 'Embedding'
}) {
	const successPercentage = (total != null ? (success / total) * 100 : 0) || 0;
	const failurePercentage = (total != null ? (failure / total) * 100 : 0) || 0;
	return (
		<div className='mb-6 h-6 max-w-[300px]'>
			<div className='max-w-[300px] relative top-[22px] -mt-6 text-center text-sm text-white px-2'>
				{text} ({successPercentage.toFixed(1)}%)
				<ButtonSpinner size={14} className='ms-2 -me-1' />
			</div>
			<div className='flex flex-row overflow-hidden rounded-full bg-gray-400 dark:bg-neutral-600'>
				<span className={'h-6 bg-green-500'} style={{ width: `${successPercentage}%` }} />
				<span
					className={'h-6 line bg-red-500'}
					style={{ left: `${failurePercentage}%`, width: `${failurePercentage}%` }}
				/>
			</div>
		</div>
	);
};

export default LoadingBar;
