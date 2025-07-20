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
import { FaPlus } from 'react-icons/fa';

export const ToolsLibrary = ({
	tools,
	fetchTools,
	setActiveTab
}: {
	tools: Tool[];
	fetchTools: Function;
	setActiveTab: Function;
}) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
	const [dialogScreen, setDialogScreen] = useState<string>('toolDisplay'); // toolDisplay, installed
	const [displayScreen, setDisplayScreen] = useState<string>('tools'); // tools, create, custom

	function handleCloseDialog() {
		setIsDialogOpen(false);
		setSelectedTool(null);
		setDialogScreen('toolDisplay');
	}

	const builtInTools = tools.filter(tool => tool.type !== ToolType.FUNCTION_TOOL);

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
								setDisplayScreen={setDisplayScreen}
								fetchTools={fetchTools}
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
					<Custom
						fetchTools={fetchTools}
						setDisplayScreen={setDisplayScreen}
						setActiveTab={setActiveTab}
					/>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-[600px] gap-6 my-10'>
						<div
							onClick={() => setDisplayScreen('custom')}
							className='h-full w-full border rounded-xl border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer items-center'>
							<div className='flex flex-col justify-around lg:justify-between w-full'>
								<div className='flex flex-col gap-1'>
									<p className='font-semibold'>+ Custom Code Tool</p>
									<p className='text-sm text-gray-500'>
										Extend capabilities with custom Python scripts.
									</p>
								</div>
								<div className='flex justify-between items-center text-xs'></div>
							</div>
						</div>
						{builtInTools
							.filter(tool => !tool.linkedToolId)
							.map((tool, index) => (
								<div
									onClick={() => {
										setIsDialogOpen(true);
										setSelectedTool(tool);
									}}
									key={index}
									className='h-[170px] w-full border border-gray-200 rounded-xl p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer overflow-auto'>
									<div className='flex flex-col justify-around lg:justify-between w-full'>
										<div className='flex flex-col gap-1 overflow-hidden'>
											<p className='font-semibold'>{tool.name}</p>
											<p className='text-sm text-gray-500 line-clamp-3'>{tool.description}</p>
										</div>
										<div className='w-full flex justify-between items-center text-xs'>
											<p
												key={index}
												className='py-1 px-2 rounded-full w-fit font-weight-bolder bg-gray-100 text-gray-500'>
												BuiltIn
											</p>
											{!tool.linkedToolId && (
												<Button
													variant='outline'
													className='text-xs flex items-center gap-1 align-middle'>
													<FaPlus className='inline-block font-extralight scale-75 text-gray-400 z-0' />{' '}
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
