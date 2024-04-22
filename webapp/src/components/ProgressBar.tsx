import React from 'react';

import ButtonSpinner from 'components/ButtonSpinner';

interface ProgressBarProps {
    successPercentage: number;
	errorPercentage?: number;
    successColor?: string;
    errorColor?: string;
	text?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = function ({ successPercentage=0, errorPercentage=0, successColor='blue', errorColor='red', text='Embedding' }) {
	return (<span className='mb-6 h-6'>
		<div className='relative top-[22px] -mt-6 text-center text-sm text-white' style={{
			textShadow: '0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black'
		}}>{text} <ButtonSpinner size={14} className='ms-2 -me-1' /> </div>
		<div className='flex flex-row overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-600'>
			
			<span className={`h-6 bg-${successColor}-400`} style={{ width: `${successPercentage}%` }} />
			<span className={`h-6 line bg-${errorColor}-400`} style={{ left: `${successPercentage}%`, width: `${errorPercentage}%` }} />
		</div>
	</span>);
};

export default ProgressBar;
