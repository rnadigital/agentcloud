import {
	ArrowPathIcon,
	CircleStackIcon,
	CubeIcon,
	CubeTransparentIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import cn from 'utils/cn';

const steps = [
	{
		title: 'Data Source',
		description: 'Pull data from your preferred system to convert it into vector format.',
		icon: <CircleStackIcon className='h-6 w-6' />
	},
	{
		title: 'Embedding Model',
		description:
			'Selecting the right model improves data interpretation, leading to better insights.',
		icon: <CubeTransparentIcon className='h-6 w-6' />
	},
	{
		title: 'Connect to Your Vector DB',
		description:
			'Choose and configure your vector database to ensure real-time syncing for up-to-date insights.',
		icon: <CubeIcon className='h-6 w-6' />
	},
	{
		title: 'Syncing Data',
		description:
			'Data is now being embedded and synced to your vector database. This may take several minutes.',
		icon: <ArrowPathIcon className='h-6 w-6' />
	}
];

const DataSourceOnboardingSteps = ({ currentStep = 0 }: { currentStep: number }) => {
	return (
		<nav>
			<ol role='list' className='overflow-hidden mt-20'>
				{steps.map((step, stepIdx) => (
					<li
						key={step.title}
						className={cn(
							stepIdx !== steps.length - 1 ? 'pb-10' : '',
							'relative',
							stepIdx !== currentStep ? 'text-gray-300' : 'text-white'
						)}
					>
						<>
							{stepIdx !== steps.length - 1 ? (
								<div
									aria-hidden='true'
									className='absolute left-[18px] top-11 -ml-px mt-0.5 h-[50%] w-0.5 border-dashed border-white border'
								/>
							) : null}
							<a aria-current='step' className='group relative flex items-start'>
								<span
									aria-hidden='true'
									className='h-9 items-center border border-white p-0.5 rounded-md aspect-square grid place-items-center'
								>
									{step.icon}
								</span>
								<span
									className={cn('ml-4 flex min-w-0 flex-col', {
										'text-gray-300': stepIdx !== currentStep
									})}
								>
									<span className='text-lg'>{step.title}</span>
									<span>{step.description}</span>
								</span>
							</a>
						</>
					</li>
				))}
			</ol>
		</nav>
	);
};

export default DataSourceOnboardingSteps;
