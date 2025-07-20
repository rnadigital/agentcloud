import { MoveLeft, MoveRight } from 'lucide-react';
import { Stepper } from 'modules/components/stepper';
import { Input } from 'modules/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';
import { Textarea } from 'modules/components/ui/textarea';
import { useState } from 'react';
import { useDataSourcesStore } from 'store/data-source';
import StepperCreateSource from './tools-stepper-create/stepper-create-source';
import StepperCreateDependencies from './tools-stepper-create/stepper-create-dependencies';
import StepperCreateParameters from './tools-stepper-create/stepper-create-parameters';
import { Button } from 'modules/components/ui/button';

type Step = {
	id: number;
	stepName: string;
	title?: string;
	description?: string;
};

export const ToolsCreate = ({
	setDisplayScreen
}: {
	setDisplayScreen: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const steps: Step[] = [
		{
			id: 1,
			stepName: 'Source'
		},
		{
			id: 2,
			stepName: 'Dependencies'
		},
		{
			id: 3,
			stepName: 'Parameters'
		}
	];

	const [currentStep, setCurrentStep] = useState<number>(1);
	const { dataSources } = useDataSourcesStore();

	return (
		<div className='flex flex-col gap-4 pb-6 rounded-lg border border-gray-200 mt-4'>
			<div className='p-4 border border-gray-200'>
				<p className='text-sm'>Create Tool</p>
			</div>
			<div className='flex px-6'>
				<div className='flex flex-col gap-4 w-full'>
					<div className='text-sm flex flex-col gap-2'>
						<p>Name</p>
						<Input placeholder='Tool name' className='p-5 bg-gray-50 border border-gray-300' />
					</div>
					<div className='text-sm flex flex-col gap-2'>
						<p>Description</p>
						<p className='text-gray-500'>
							A verbose and detailed description helps agents to better understand when to use this
							tool
						</p>
						<Textarea
							id='goal'
							className='resize-none h-20 bg-gray-50 border-gray-300'
							placeholder='Help potential customers understand product benefits and close sales.'
						/>
					</div>
					<div className='text-sm flex flex-col gap-2'>
						<p>Data Source</p>
						<Select>
							<SelectTrigger className='w-[180px] w-full lg:w-fit'>
								<SelectValue placeholder='Select data source' />
							</SelectTrigger>
							<SelectContent>
								{dataSources.map(dataSource => (
									<SelectItem key={dataSource.value} value={dataSource.value}>
										{dataSource.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='text-sm flex gap-2 border border-gray-300 rounded-md'>
						<div className='p-4 border-r border-gray-300'>
							<Stepper steps={steps} currentStep={currentStep} />
						</div>
						<div className='flex flex-col justify-between gap-4 p-4 w-full'>
							{currentStep === 1 && <StepperCreateSource />}
							{currentStep === 2 && <StepperCreateDependencies />}
							{currentStep === 3 && <StepperCreateParameters />}
							<div className='flex items-center justify-between'>
								{currentStep > 1 && (
									<Button
										onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
										asChild
									>
										<div className='flex items-center gap-2 font-medium cursor-pointer bg-transparent hover:bg-transparent border-0 shadow-none outline-none'>
											<MoveLeft color='#6B7280' />
											<p className='text-gray-500'>Back</p>
										</div>
									</Button>
								)}
								{currentStep < steps.length && (
									<Button
										onClick={() => currentStep < steps.length && setCurrentStep(currentStep + 1)}
										asChild
									>
										<div className='ml-auto flex items-center gap-2 font-medium cursor-pointer bg-transparent hover:bg-transparent border-0 shadow-none outline-none'>
											<p className='text-[#4F46E5]'>Next</p>
											<MoveRight color='#4F46E5' />
										</div>
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className='flex items-center justify-between border-t border-gray-200 p-[16px]'>
				<Button
					onClick={() => setDisplayScreen('tools')}
					className='bg-transparent text-foreground hover:bg-transparent hover:text-foreground'
				>
					Cancel
				</Button>
				<Button
					onClick={() => setDisplayScreen('tools')}
					className='bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'
				>
					Save
				</Button>
			</div>
		</div>
	);
};
