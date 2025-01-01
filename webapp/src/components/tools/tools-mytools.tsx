import { Box, Ellipsis, Expand, Wrench } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useToolStore } from 'store/tool';
import { ToolsEdit } from './tools-edit';
import { TabsContent } from 'modules/components/ui/tabs';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';

export const ToolsMytools = () => {
	const { tools } = useToolStore();
	const [displayScreen, setDisplayScreen] = useState<string>('tools'); // tools, edit

	return (
		<Fragment>
			{displayScreen === 'edit' && <ToolsEdit setDisplayScreen={setDisplayScreen} />}
			{displayScreen === 'tools' && (
				<TabsContent value='my-tools'>
					{tools.some(tool => tool.isInstalled) ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-[600px]'>
							{tools
								.filter(tool => tool.isInstalled)
								.map((tool, index) => (
									<div
										key={index}
										className='flex items-start gap-4 w-full h-[200px] h-[170px] border border-gray-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer'>
										<Box color='#2F2A89' width={40} className='mt-3 lg:mt-1' />
										<div className='flex flex-col justify-around lg:justify-between'>
											<div className='flex flex-col gap-1'>
												<p className='font-semibold'>{tool.title}</p>
												<p className='text-sm text-gray-500'>{tool.description}</p>
											</div>
											<div className='flex justify-between items-center text-xs'>
												{tool.tags.map((tag, index) => (
													<p
														key={index}
														className='py-1 px-2 rounded-full w-fit'
														style={{
															color: tag.textColor,
															backgroundColor: tag.backgroundColor
														}}>
														{tag.name}
													</p>
												))}
											</div>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Ellipsis />
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuItem onClick={() => setDisplayScreen('edit')}>
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className='text-red-600'
													onClick={() => alert('Delete action triggered')}>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								))}
						</div>
					) : (
						<div className='cursor-pointer bg-gray-100 p-6 gap-4 rounded-lg flex flex-col items-center justify-center'>
							<div className='bg-background w-12 h-12 flex items-center justify-center rounded-full'>
								<Wrench />
							</div>
							<div className='flex items-center gap-2 font-medium'>
								<Expand />
								<p>Explore tools</p>
							</div>
							<p className='text-gray-500'>
								Browse platform tools to add them to your collection or create new ones
							</p>
						</div>
					)}
				</TabsContent>
			)}
		</Fragment>
	);
};
