import useResponsive from 'hooks/useResponsive';
import { Box, CircleChevronLeft } from 'lucide-react';

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

export const ToolDisplay = ({
	selectedTool,
	setSelectedTool,
	setScreen
}: {
	selectedTool: Tool | null;
	setSelectedTool: React.Dispatch<React.SetStateAction<Tool | null>>;
	setScreen: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const { isMobile } = useResponsive();

	return (
		<section className='flex flex-col gap-6 h-full'>
			<article
				onClick={() => {
					setScreen('initial');
					setSelectedTool(null);
				}}
				className='flex items-center gap-2 text-gray-500 text-sm cursor-pointer'
			>
				<CircleChevronLeft width={15} />
				<p>Back to list</p>
			</article>
			<article className='text-sm flex gap-2 border border-gray-200 p-4'>
				{!isMobile && <Box color='#2F2A89' width={25} className='mt-3' />}
				<div className='flex flex-col gap-2 w-full'>
					<p className='border rounded-lg border-gray-300 bg-gray-50 py-3 px-4 w-full'>
						{selectedTool?.title}
					</p>
					<div className='border border-gray-300 bg-gray-50 py-3 px-4 rounded-lg min-h-28'>
						{selectedTool?.description && (
							<p className='text-gray-900 text-sm'>
								{/* {selectedTool.description} */}
								This tool allows you to search Linkedin for professional profiles. It uses Al to
								parse the search results and return the most relevant profiles. It can be used to
								find potential job candidates, business partners, or industry experts.
							</p>
						)}
					</div>
					<div className='flex gap-2 mt-4 flex-col lg:flex-row'>
						<div>
							{selectedTool?.tags &&
								selectedTool?.tags?.length > 0 &&
								selectedTool?.tags?.map((tag, index) => (
									<p
										key={index}
										className='py-1 px-2 rounded-full w-fit font-medium text-xs'
										style={{
											color: tag.textColor,
											backgroundColor: tag.backgroundColor
										}}
									>
										{tag.name}
									</p>
								))}
						</div>
						<div className='flex justify-around w-full flex-col lg:flex-row gap-4'>
							<div className='text-gray-500 text-sm'>
								<p>Use Cases</p>
								<ul className='flex flex-col gap-1'>
									<li>. Scrape job postings</li>
									<li>. Scrape company profiles</li>
									<li>. Scrape user profiles</li>
								</ul>
							</div>
							<div className='flex flex-col gap-1 text-gray-500 text-sm'>
								<div className='flex items-center gap-2'>
									<p>Version : </p>
									<p>1.0</p>
								</div>
								<div className='flex items-center gap-2'>
									<p>Publisher : </p>
									<p>Agent Cloud</p>
								</div>
								<div className='flex items-center gap-2'>
									<p>Released On : </p>
									<p>June 24, 2024</p>
								</div>
								<div className='flex items-center gap-2'>
									<p>Last Updated at : </p>
									<p>June 24, 2024</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</article>
		</section>
	);
};
