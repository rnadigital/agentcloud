import { Box, Check } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import { Tool } from 'struct/tool';

export const Install = ({
	selectedTool,
	setSelectedTool,
	setScreen,
	type,
	setIsDialogOpen,
	setActiveTab
}: {
	selectedTool: Tool | null;
	setSelectedTool: React.Dispatch<React.SetStateAction<Tool | null>>;
	setScreen: React.Dispatch<React.SetStateAction<string>>;
	setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	type: string;
	setActiveTab: Function;
}) => {
	return (
		<section className='flex flex-col gap-6 items-center rounded-lg border border-gray-200 shadow-md h-full justify-center p-10'>
			<div className='flex flex-col gap-2 items-center'>
				<div className='flex items-center gap-2'>
					<Box color='#2F2A89' width={14} />
					<p className='font-semibold'>{selectedTool?.name}</p>
				</div>
				<div className='flex items-center gap-2'>
					<div>
						<Check className='bg-green-100 rounded-full p-1' color='#0E9F6E' />
					</div>
					<p className='text-green-500 font-medium text-lg'>Tool Successfully Installed!</p>
				</div>
				<div className='flex items-center gap-2'>
					<p className='text-gray-500 font-medium'>Your tool has been added to My Tools.</p>
				</div>
			</div>
			<Button
				className='bg-[#4F46E5] rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#4F46E5]/80'
				onClick={() => {
					setSelectedTool(null);
					if (type === 'page') {
						setScreen('toolDisplay');
						setIsDialogOpen(false);
					} else {
						setScreen('initial');
					}
					setActiveTab('my-tools');
				}}
			>
				{type === 'page' ? 'Go to My Tools' : 'Add Tool to Agent'}
			</Button>
		</section>
	);
};
