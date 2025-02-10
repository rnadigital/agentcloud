import { ArrowPathIcon, Bars3Icon, CircleStackIcon } from '@heroicons/react/24/outline';
import cn from 'utils/cn';
import React from 'react';

const steps = [
	{
		title: 'Data Source',
		icon: <CircleStackIcon className='h-5 w-5' />
	},
	{
		title: 'Details',
		icon: <Bars3Icon className='h-5 w-5' />
	},
	{
		title: 'Data sync',
		icon: <ArrowPathIcon className='h-5 w-5' />
	}
];

const DataSourceConfigSteps = ({ currentStep = 0 }: { currentStep: number }) => {
	return (
		<div className='flex items-center'>
			{steps.map((step, stepIdx) => {
				return (
					<>
						<div
							className={cn(
								'p-1 rounded-full h-8 w-8 grid place-items-center',
								stepIdx === currentStep
									? 'text-primary-500 bg-primary-50'
									: 'text-gray-400 bg-gray-100'
							)}
						>
							{step.icon}
						</div>
						<div className='ml-3'>{step.title}</div>
						{stepIdx < steps.length - 1 && <div className='flex-1 border-b border-gray-300 mx-2' />}
					</>
				);
			})}
			{/* <div className='p-1 rounded-full bg-primary-50'>
				<CircleStackIcon className='h-6 w-6 text-primary-500' />
			</div>
			<div className='ml-3'>Select type</div>
			<div className='flex-1 border-b border-gray-300' />
			<div className='p-1 rounded-full bg-primary-50'>
				<Bars3Icon className='h-6 w-6 text-primary-500' />
			</div> */}
		</div>
	);
};

export default DataSourceConfigSteps;
