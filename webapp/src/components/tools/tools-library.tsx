import * as API from '@api';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from 'modules/components/ui/dialog';
import { Fragment, useState } from 'react';
import { useToolStore } from 'store/tool';
import { ToolDisplay } from './toolsdialogscreens/Tool';
import { Install } from './toolsdialogscreens/Install';
import { Button } from 'modules/components/ui/button';
import { TabsContent } from 'modules/components/ui/tabs';
import { Custom } from './toolsdialogscreens/Custom';
import { ToolsCreate } from './tools-create';
import { Tool, ToolType } from 'struct/tool';
import { useRouter } from 'next/router';
import { useAccountContext } from 'context/account';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'react-toastify';

export const ToolsLibrary = ({
	tools,
	fetchTools,
	setActiveTab
}: {
	tools: Tool[];
	fetchTools: Function;
	setActiveTab: Function;
}) => {
	// const { tools } = useToolStore();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
	const [dialogScreen, setDialogScreen] = useState<string>('toolDisplay'); // toolDisplay, installed
	const [displayScreen, setDisplayScreen] = useState<string>('tools'); // tools, create, custom

	function handleCloseDialog() {
		setSelectedTool(null);
		setIsDialogOpen(false);
		setDialogScreen('toolDisplay');
	}

	return (
		<Fragment>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='rounded-3xl sm:max-w-[864px] w-[90%] text-foreground  flex flex-col justify-between'>
					<DialogHeader>
						<DialogTitle className='font-semibold text-2xl text-foreground'>
							Install Tool
						</DialogTitle>
					</DialogHeader>
					{selectedTool !== null &&
						(dialogScreen === 'toolDisplay' ? (
							<ToolDisplay
								setScreen={setDialogScreen}
								selectedTool={selectedTool}
								setSelectedTool={setSelectedTool}
								handleCloseDialog={handleCloseDialog}
								setDialogScreen={setDialogScreen}
								callback={() => fetchTools()}
							/>
						) : dialogScreen === 'installed' ? (
							<Install
								type={'page'}
								setScreen={setDialogScreen}
								setSelectedTool={setSelectedTool}
								selectedTool={selectedTool}
								setIsDialogOpen={setIsDialogOpen}
								setActiveTab={setActiveTab}
							/>
						) : null)}
				</DialogContent>
			</Dialog>
			<TabsContent value='tool-library'>
				{displayScreen === 'create' ? (
					<ToolsCreate setDisplayScreen={setDisplayScreen} />
				) : displayScreen === 'custom' ? (
					<Custom />
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-[600px]'>
						<div
							onClick={() => setDisplayScreen('custom')}
							className='w-full h-[170px] border border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer items-center'>
							<div className='flex flex-col justify-around lg:justify-between'>
								<div className='flex flex-col gap-1'>
									<p className='font-semibold'>+ Custom Code Tool</p>
									<p className='text-sm text-gray-500'>
										Extend capabilities with custom Python scripts.
									</p>
								</div>
								<div className='flex justify-between items-center text-xs'></div>
							</div>
						</div>
						{tools
							.filter(tool => !tool.linkedToolId)
							.map((tool, index) => (
								<div
									onClick={() => {
										setIsDialogOpen(true);
										setSelectedTool(tool);
									}}
									key={index}
									className='w-full h-[170px] border border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer overflow-auto'>
									{/* {!tool.isInstalled && <Box color='#2F2A89' width={40} className='mt-3 lg:mt-1' />} */}
									<div className='flex flex-col justify-around lg:justify-between'>
										<div className='flex flex-col gap-1'>
											<p className='font-semibold'>{tool.name}</p>
											<p className='text-sm text-gray-500 line-clamp-3'>{tool.description}</p>
										</div>
										<div className='flex justify-between items-center text-xs'>
											<p key={index} className='py-1 px-2 rounded-full w-fit'>
												Custom Tool
											</p>
											{!tool.linkedToolId && (
												<Button variant='outline' className='text-xs'>
													Install
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
					</div>
				)}
			</TabsContent>
		</Fragment>
	);
};
