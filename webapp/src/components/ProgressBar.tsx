import ButtonSpinner from 'components/ButtonSpinner';
import React from 'react';

interface ProgressBarProps {
	total?: number
    success?: number;
	failure?: number;
	text?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = function ({ total=null, success=0, failure=0, text='Embedding' }) {
	const successPercentage = total != null ? (success/total)*100 : 0;
	const failurePercentage = total != null ? (failure/total)*100 : 0;
	return (<div className='mb-6 h-6 max-w-[300px]'>
		<div className='max-w-[300px] relative top-[22px] -mt-6 text-center text-sm text-white'>
			<span className='tooltip z-100'>
				{text}{' '}
				({successPercentage.toFixed(1).endsWith(0) ? successPercentage : successPercentage.toFixed(1)}%)
				<span className='tooltiptext capitalize !w-[150px] !-ml-[75px] whitespace-pre'>
					{total && `${(success||0)+(failure||0)}/${total} (${successPercentage.toFixed(1)}%)\nsuccess: ${success||0}\nfailure: ${failure||0}`}
				</span>
			</span>
			<ButtonSpinner size={14} className='ms-2 -me-1' />
		</div>
		<div className='flex flex-row overflow-hidden rounded-full bg-gray-400 dark:bg-neutral-600'>
			<span className={'h-6 bg-green-500'} style={{ width: `${successPercentage}%` }} />
			<span className={'h-6 line bg-red-500'} style={{ left: `${failurePercentage}%`, width: `${failurePercentage}%` }} />
		</div>
	</div>);
};

export default ProgressBar;
