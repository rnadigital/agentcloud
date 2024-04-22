import ButtonSpinner from 'components/ButtonSpinner';
import React from 'react';

interface ProgressBarProps {
	total?: number
    success?: number;
	failure?: number;
	text?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = function ({ total=1000, success=500, failure=25, text='Embedding' }) {
	const successPercentage = total != null ? Math.floor((success/total)*100) : 0;
	const failurePercentage = total != null ? Math.floor((failure/total)*100) : 0;
	console.log(Math.floor((success/total)*100))
	return (<div className='mb-6 h-6 max-w-[300px]'>
		<div className='max-w-[300px] relative top-[22px] -mt-6 text-center text-sm text-white' style={{
			textShadow: '0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black'
		}}>{text}{total && `(${(success||0)+(failure||0)}/${total})`} <ButtonSpinner size={14} className='ms-2 -me-1' /> </div>
		<div className='flex flex-row overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-600'>
			<span className={`h-6 bg-blue-400`} style={{ width: `${successPercentage}%` }} />
			<span className={`h-6 line bg-red-400`} style={{ left: `${failurePercentage}%`, width: `${failurePercentage}%` }} />
		</div>
	</div>);
};

export default ProgressBar;
