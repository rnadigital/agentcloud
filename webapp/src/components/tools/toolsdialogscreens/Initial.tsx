import useResponsive from 'hooks/useResponsive';
import { Box, Search } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import { Input } from 'modules/components/ui/input';
import { Label } from 'modules/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'modules/components/ui/tabs';
import { useToolStore } from 'store/tool';

interface Tool {
	title: string;
	description: string;
	isInstalled: boolean;
	tags: {
		name: string;
		textColor: string;
		backgroundColor: string;
	}[];
}

export const Initial = ({
	setSelectedTool,
	setScreen
}: {
	setSelectedTool: React.Dispatch<React.SetStateAction<Tool | null>>;
	setScreen: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const { tools } = useToolStore();
	const { isMobile } = useResponsive();

	return (
		<section className='flex justify-between relative h-full'>
			<Tabs defaultValue='tool-library' className='mt-4 w-full'>
				<TabsList className='bg-transparent p-0 flex items-center'>
					<div className='flex items-center w-full'>
						<TabsTrigger className='w-fit text-gray-500' variant='underline' value='my-tools'>
							My Tools
						</TabsTrigger>
						<TabsTrigger className='w-fit text-gray-500' variant='underline' value='tool-library'>
							Tool Library
						</TabsTrigger>
						{isMobile && (
							<TabsTrigger className='w-fit text-gray-500' variant='underline' value='search-tool'>
								<Search width={14} />
							</TabsTrigger>
						)}
					</div>
					{!isMobile && (
						<div className='top-4 right-0 bg-gray-50 rounded-md px-4 py-1 border border-gray-300 text-gray-500 flex gap-2 items-center self-start'>
							<Label htmlFor='search-tool' className='flex items-center'>
								<Search width={14} />
							</Label>
							<Input
								type='text'
								id='search-tool'
								placeholder='Search Tool'
								className='w-[100px] border-0 bg-transparent ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 p-0 h-auto shadow-none'
							/>
						</div>
					)}
				</TabsList>
				<TabsContent value='my-tools' className='w-full'></TabsContent>
				<TabsContent value='tool-library' className='h-full'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-[600px] overflow-y-auto overflow-x-hidden pr-2'>
						<div
							onClick={() => setScreen('new')}
							className='w-full h-[200px] sm:w-[272px] h-[170px] border border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer'
						>
							<div className='flex flex-col justify-around lg:justify-between'>
								<div className='flex flex-col gap-1'>
									<p className='font-semibold'>+ New RAG Tool</p>
									<p className='text-sm text-gray-500'>
										Combines data retrieval with AI for quick, relevant info
									</p>
								</div>
								<div className='flex justify-between items-center text-xs'></div>
							</div>
						</div>
						<div
							onClick={() => setScreen('custom')}
							className='w-full h-[200px] sm:w-[272px] h-[170px] border border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer'
						>
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
						{tools.map((tool, index) => (
							<div
								key={index}
								className='w-full h-[200px] sm:w-[272px] h-[170px] border border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer'
							>
								{!tool.isInstalled && <Box color='#2F2A89' width={40} className='mt-3 lg:mt-1' />}
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
												}}
											>
												{tag.name}
											</p>
										))}
										{!tool.isInstalled && (
											<Button
												variant='outline'
												className='text-xs'
												onClick={() => {
													setSelectedTool(tool);
													setScreen('tool');
												}}
											>
												Install
											</Button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</TabsContent>
				<TabsContent value='search-tool' className='w-full h-full'>
					<div className='w-full'>
						<Input
							type='text'
							id='search-tool'
							placeholder='Search Tool'
							className='border-0 bg-transparent ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 p-0 h-auto shadow-none border border-gray-300 rounded-lg px-4 py-1 w-full'
						/>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-[600px] overflow-y-auto overflow-x-hidden mt-2 '>
							{tools.map((tool, index) => (
								<div
									key={index}
									className='w-full h-[200px] sm:w-[272px] h-[170px] border border-gray-200 p-4 gap-2 shadow-sm hover:shadow-md transition flex cursor-pointer'
								>
									{!tool.isInstalled && <Box color='#2F2A89' width={40} className='mt-3 lg:mt-1' />}
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
													}}
												>
													{tag.name}
												</p>
											))}
											{!tool.isInstalled && (
												<Button
													variant='outline'
													className='text-xs'
													onClick={() => setSelectedTool(tool)}
												>
													Install
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</section>
	);
};
