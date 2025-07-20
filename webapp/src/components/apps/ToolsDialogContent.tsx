import { Button } from 'modules/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from 'modules/components/ui/dialog';
import { useState } from 'react';
import { useToolStore } from 'store/tool';

import { Custom } from './toolsdialogscreens/Custom';
import { Initial } from './toolsdialogscreens/Initial';
import { Install } from './toolsdialogscreens/Install';
import { New } from './toolsdialogscreens/New';
import { ToolDisplay } from './toolsdialogscreens/Tool';
import { MultiSelect } from 'modules/components/multi-select';

type Tool = {
	title: string;
	description: string;
	isInstalled: boolean;
	tags: {
		name: string;
		textColor: string;
		backgroundColor: string;
	}[];
};

export const ToolsDialogContent = ({
	isDialogOpen,
	setIsDialogOpen,
	toolValue,
	setToolValue,
	tools
}: any) => {
	const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
	const [screen, setScreen] = useState<string>('initial'); // screen, install, new, custom

	function handleCloseDialog() {
		setSelectedTool(null);
		setIsDialogOpen(false);
		setScreen('initial');
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<MultiSelect
				options={tools}
				onValueChange={setToolValue}
				defaultValue={toolValue}
				placeholder='Tools'
				// maxCount={1}
			/>
			<DialogContent className='rounded-3xl sm:max-w-[864px] w-[90%] text-foreground  flex flex-col justify-between'>
				<DialogHeader>
					<DialogTitle className='font-semibold text-2xl text-foreground'>
						{screen === 'new'
							? 'Create RAG Tool'
							: screen === 'custom'
								? 'Custom Code Tool'
								: 'Tools'}
					</DialogTitle>
				</DialogHeader>
				{screen === 'initial' ? (
					<Initial setScreen={setScreen} setSelectedTool={setSelectedTool} />
				) : screen === 'install' ? (
					<Install setScreen={setScreen} setSelectedTool={setSelectedTool} />
				) : screen === 'new' ? (
					<New />
				) : screen === 'custom' ? (
					<Custom />
				) : screen === 'tool' && selectedTool ? (
					<ToolDisplay
						setScreen={setScreen}
						selectedTool={selectedTool}
						setSelectedTool={setSelectedTool}
					/>
				) : null}
				<DialogFooter className='sm:space-x-2'>
					<div className='flex w-full justify-between items-center border-t border-gray-200 py-4'>
						<Button
							onClick={handleCloseDialog}
							className='bg-transparent text-foreground hover:bg-transparent hover:text-foreground'
						>
							Cancel
						</Button>
						{selectedTool && screen === 'tool' && (
							<Button
								onClick={() => setScreen('install')}
								className='bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'
							>
								Save
							</Button>
						)}
						{screen === 'new' && (
							<Button
								onClick={() => setScreen('install')}
								className='bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'
							>
								Save
							</Button>
						)}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
