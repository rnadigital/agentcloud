import { Box, Ellipsis } from 'lucide-react';
import { Fragment, useState } from 'react';
import { ToolsEdit } from './tools-edit';
import { TabsContent } from 'modules/components/ui/tabs';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import { Tool, ToolType } from 'struct/tool';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import * as API from '@api';
import { ToolDisplay } from './toolsdialogscreens/Tool';

export const ToolsMytools = ({
	tools,
	fetchTools,
	setActiveTab
}: {
	tools?: Tool[];
	fetchTools: Function;
	setActiveTab: Function;
}) => {
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [displayScreen, setDisplayScreen] = useState<string>('tools'); // tools, edit
	const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
	const [dialogScreen, setDialogScreen] = useState<string>('toolDisplay');

	async function deleteTool(toolId: string) {
		try {
			const response = await API.deleteTool(
				{
					_csrf: csrf,
					resourceSlug,
					toolId,
					type: ToolType.FUNCTION_TOOL
				},
				() => {
					fetchTools();
					toast.success('Tool deleted successfully');
				},
				err => {
					console.error('Error deleting tool:', err);
					toast.error(`Error deleting tool: ${err.message || 'Unknown error'}`);
				},
				router
			);

			if (!response || response.status === 400) {
				throw new Error('Bad Request: The server rejected the delete operation');
			}
		} catch (error) {
			console.error('Failed to delete tool:', error);
			toast.error(`Failed to delete tool: ${error.message || 'Unknown error'}`);
		}
	}

	const handleEdit = (tool: Tool) => {
		setSelectedTool(tool);
		setIsDialogOpen(true);
		setDisplayScreen('edit');
	};

	const handleEditBuiltIn = (tool: Tool) => {
		setSelectedTool(tool);
		setIsDialogOpen(true);
		setDisplayScreen('edit');
		setDialogScreen('toolDisplay');
	};

	return (
		<Fragment>
			{displayScreen === 'edit' && (
				<ToolsEdit
					tool={selectedTool}
					setSelectedTool={setSelectedTool}
					isDialogOpen={isDialogOpen}
					setIsDialogOpen={setIsDialogOpen}
					dialogScreen={dialogScreen}
					setDialogScreen={setDialogScreen}
					setDisplayScreen={setDisplayScreen}
					fetchTools={fetchTools}
					setActiveTab={setActiveTab}
				/>
			)}
			{displayScreen === 'tools' && (
				<TabsContent value='my-tools'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
						{tools
							?.filter(tool => tool.linkedToolId)
							?.map((tool, index) => (
								<div
									key={index}
									className='w-full h-[170px] border border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex justify-around cursor-pointer overflow-auto'
								>
									<div className='flex flex-col justify-around lg:justify-between'>
										<div className='flex flex-col gap-1'>
											<p className='font-semibold align-middle'>
												<Box color='#2F2A89' width={40} className='inline-block' />
												{tool.name}
											</p>
											<p className='text-sm text-gray-500'>{tool.description}</p>
										</div>
										<div className='w-full flex justify-between items-center text-xs'>
											<p
												key={index}
												className='py-1 px-2 rounded-full w-fit font-weight-bolder bg-gray-100 text-gray-500'
											>
												BuiltIn
											</p>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger className='mb-auto'>
											<Ellipsis />
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end'>
											<DropdownMenuItem onClick={() => handleEditBuiltIn(tool)}>
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												className='text-red-600'
												onClick={() => deleteTool(tool._id.toString())}
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							))}

						{tools
							?.filter(tool => tool.type === ToolType.FUNCTION_TOOL)
							?.map((tool, index) => (
								<div
									key={index}
									className='h-[170px] w-full border border-gray-200 rounded-xl p-4 gap-2 shadow-sm hover:shadow-md transition flex justify-around cursor-pointer overflow-auto'
								>
									<div className='flex flex-col justify-around lg:justify-between w-full'>
										<div className='flex flex-col gap-1 overflow-hidden'>
											<p className='font-semibold'>{tool.name}</p>
											<p className='text-sm text-gray-500 line-clamp-3'>{tool.description}</p>
										</div>
										<div className='w-full flex justify-between items-center text-xs'>
											<p
												key={index}
												className='py-1 px-2 rounded-full w-fit font-weight-bolder bg-gray-100 text-gray-500'
											>
												CustomTool
											</p>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger className='mb-auto'>
											<Ellipsis />
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end'>
											<DropdownMenuItem onClick={() => handleEdit(tool)}>Edit</DropdownMenuItem>
											<DropdownMenuItem
												className='text-red-600'
												onClick={() => deleteTool(tool._id.toString())}
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							))}
					</div>
				</TabsContent>
			)}
		</Fragment>
	);
};
