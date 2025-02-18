import { useState } from 'react';
import ToolForm from './ToolForm';
import { ToolDisplay } from './toolsdialogscreens/Tool';
import { Install } from './toolsdialogscreens/Install';
import { Button } from 'modules/components/ui/button';
import { useDataSourcesStore } from 'store/data-source';
import { Tool, ToolType } from 'struct/tool';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from 'modules/components/ui/dialog';

export const ToolsEdit = ({
	tool,
	setSelectedTool,
	isDialogOpen,
	setIsDialogOpen,
	dialogScreen,
	setDialogScreen,
	setDisplayScreen,
	setActiveTab,
	fetchTools
}: {
	tool: Tool;
	setSelectedTool: Function;
	isDialogOpen: boolean;
	setIsDialogOpen: Function;
	dialogScreen: any;
	setDialogScreen: any;
	setDisplayScreen: React.Dispatch<React.SetStateAction<string>>;
	setActiveTab: Function;
	fetchTools: Function;
}) => {
	const { dataSources } = useDataSourcesStore();

	function handleCloseDialog() {
		setIsDialogOpen(false);
		setDisplayScreen('tools');
	}

	return (
		<div className='flex flex-col gap-4 pb-6 rounded-lg border border-gray-200 mt-4'>
			<div className='p-4 border border-gray-200'>
				<p className='text-sm'>Edit Tool</p>
			</div>
			<div className='flex px-6'>
				<div className='flex flex-col gap-4 w-full'>
					{tool.type === ToolType.FUNCTION_TOOL ? (
						<ToolForm
							tool={tool}
							datasources={dataSources}
							editing={true}
							initialType={ToolType.FUNCTION_TOOL}
							fetchFormData={fetchTools}
							setDisplayScreen={setDisplayScreen}
							fetchTools={fetchTools}
							setActiveTab={setActiveTab}
						/>
					) : (
						// <Install
						//     selectedTool={tool}
						//     setSelectedTool={setSelectedTool}
						//     setScreen={setDisplayScreen}
						//     type={'edit'}
						//     setIsDialogOpen={setIsDialogOpen}
						//     setActiveTab={() => {}}
						// />
						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen as any}>
							<DialogContent className='rounded-3xl sm:max-w-[864px] w-[90%] text-foreground  flex flex-col justify-between'>
								<DialogHeader>
									<DialogTitle className='font-semibold text-2xl text-foreground'>
										Install Tool
									</DialogTitle>
								</DialogHeader>

								{dialogScreen === 'toolDisplay' && (
									<ToolDisplay
										setDisplayScreen={setDisplayScreen}
										setScreen={setDialogScreen}
										selectedTool={tool}
										editing={true}
										fetchTools={fetchTools}
										setSelectedTool={setSelectedTool as any}
										handleCloseDialog={handleCloseDialog}
										setDialogScreen={setDialogScreen}
										callback={() => fetchTools()}
									/>
								)}
								{/* // ) : dialogScreen === 'installed' ? (
                                //     <Install
                                //         type={'page'}
                                //         setScreen={setDialogScreen}
                                //         setSelectedTool={setSelectedTool}
                                //         selectedTool={tool}
                                //         setIsDialogOpen={setIsDialogOpen}
                                //         setActiveTab={setActiveTab}
                                //     />
                                // ) : null} */}
							</DialogContent>
						</Dialog>
					)}
				</div>
			</div>
		</div>
	);
};
