import cn from 'utils/cn';

type Step = {
	stepName: string;
	title?: string;
	description?: string;
};

type StepperProps = {
	steps: Step[];
	currentStep: number;
};

export function Stepper({ steps, currentStep }: StepperProps) {
	return (
		<div className='flex flex-col w-full'>
			{steps.map((step, index) => (
				<div
					key={index}
					className={cn(
						'flex items-center py-4',
						index + 1 === currentStep ? 'text-blue-500' : 'text-gray-500'
					)}
				>
					<div
						className={cn(
							'flex items-center justify-center w-8 h-8 rounded-full border-2',
							index + 1 === currentStep ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
						)}
					>
						{index + 1}
					</div>
					<span className='ml-4 font-medium'>{step.stepName}</span>
				</div>
			))}
		</div>
	);
}
