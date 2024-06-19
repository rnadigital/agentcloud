import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../../api';
import { useAccountContext } from '../../context/account';
import Tool from './Tool';

interface Tool {
	id: string;
	name: string;
	imageURL: string;
	description: string;
	category: string;
	creator: string;
}
const dummyTools: Tool[] = [
	{
		id: '1',
		name: 'Search LinkedIn',
		imageURL: 'https://picsum.photos/50',
		description: 'This tool allows you to search LinkedIn for professional profiles. It uses AI to parse the search results and return the most relevant profiles. It can be used to find potential job candidates, business partners, or industry experts.',
		creator: 'AI',
		category: "internal"
	},
	{
		id: '2',
		name: 'Generate Image',
		imageURL: 'https://picsum.photos/50',
		description: 'This tool uses AI to generate an image based on given parameters. You can specify the color scheme, style, and subject of the image. The AI will then create a unique image that fits your specifications.',
		creator: 'AI',
		category: "internal"
	},
	{
		id: '3',
		name: 'Add Subtitles',
		imageURL: 'https://picsum.photos/50',
		description: 'This tool uses AI to add subtitles to a video file. It automatically transcribes the audio and syncs the text with the video. This can be used to make videos more accessible or to translate the dialogue into another language.',
		creator: 'AI',
		category: "internal"
	},
	{
		id: '4',
		name: 'Translate Text',
		imageURL: 'https://picsum.photos/50',
		description: 'This tool uses AI to translate text from one language to another. It supports a wide range of languages and can handle both short phrases and long documents. The AI ensures that the translation is accurate and maintains the original tone and style.',
		creator: 'AI',
		category: "internal"
	},
	{
		id: '5',
		name: 'Summarize Article',
		imageURL: 'https://picsum.photos/50',
		description: 'This tool uses AI to summarize a long article into a short paragraph. It identifies the key points in the article and presents them in a concise summary. This can be used to quickly understand the content of an article without reading the whole thing.',
		creator: 'AI',
		category: "internal"
	}
]

let toolList = {
	internal: [],
	writing: [],
	productivity: [],
	education: []
}

dummyTools.forEach(tool => {
	switch (tool.category) {
		case "internal":
			toolList.internal.push(tool);
			// toolList.writing.push(tool);
			break;
		case "writing":
			toolList.writing.push(tool);
			break;
		case "productivity":
			toolList.productivity.push(tool);
			break;
		case "education":
			toolList.education.push(tool);
			break;
		default:
			console.log(`Invalid category: ${tool.category}`);
	}
});




export default function ToolList({ tools, fetchTools }) {
	console.log(tools)

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteTool(toolId) {
		API.deleteTool({
			_csrf: csrf,
			resourceSlug,
			toolId,
		}, () => {
			fetchTools();
			toast('Deleted tool');
		}, () => {
			toast.error('Error deleting tool');
		}, router);
	}
	return (
		<div className='flex flex-col items-center justify-center '>
			{Object.keys(toolList).map((category) => {
				if (toolList[category].length === 0) {
					return null
				}
				let title;
				let description;
				switch (category) {
					case "internal":
						title = "By Agent Cloud";
						description = "Tools built by AgentCloud team";
						break;
					case "writing":
						title = "Writing";
						description = "Writing tools";
						break;
					case "productivity":
						title = "Productivity";
						description = "Productivity tools";
						break;
					case "education":
						title = "Education";
						description = "Educational tools";
						break;
					default:
						title = "Other";
						description = "Other tools";
				}
				return (
					<div key={category} className='w-full text-left max-w-4xl'>
						<h2 className='text-xl font-semibold'>{title}</h2>
						<p className='text-sm mb-4'>{description}</p>
						<ul role='list' className='grid grid-cols-1 gap-6 md:grid-cols-2 md:max-w-4xl'>
							{toolList[category].map((tool, index) => (
								<Tool key={tool.id} {...tool} position={index + 1} />
							))}
						</ul>
					</div>
				);
			})}

			{/* <div className='flex justify-center'>
				<ul role='list' className='grid grid-cols-1 gap-6 md:grid-cols-2 md:max-w-4xl'>

					{dummyTools.map((tool, index) => (
						<Tool key={tool.id} {...tool} position={index + 1} />))} */}
			{/* {tools.map((tool) => (
					<li key={tool._id} className='col-span-1 divide-y divide-gray-200 dark:divide-slate-600 rounded-lg bg-white shadow dark:bg-slate-800 dark:border dark:border-slate-600'>
						<div className='flex w-full items-center justify-between space-x-6 p-6'>
							<div className='flex-1 truncate'>
								<div className='flex items-center space-x-3'>
									<h3 className='truncate text-sm font-medium text-gray-900 dark:text-white'>{tool.name}</h3>
								</div>
								<p className='my-1 truncate text-sm text-gray-500 dark:text-slate-400'>{tool.type} - {tool?.data?.description || tool?.description}</p>
							</div>
							<div className='h-10 w-10 flex-shrink-0 rounded-full bg-gray-300 dark:bg-slate-700 text-center text-xl font-bold pt-1'>
								<span>{tool.name.charAt(0).toUpperCase()}</span>
							</div>
						</div>
						<div>
							<div className='-mt-px flex divide-x divide-gray-200 dark:divide-slate-600'>
								<div className='flex w-0 flex-1'>
									<a
										href={`/${resourceSlug}/tool/${tool._id}/edit`}
										className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white'
									>
										<PencilIcon className='h-5 w-5 text-gray-400 dark:text-white' aria-hidden='true' />
										Edit
									</a>
								</div>
								<div className='-ml-px flex w-0 flex-1'>
									<button
										onClick={(e) => {
											deleteTool(tool._id);
										}}
										className='relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-red-600'
									>
										<TrashIcon className='h-5 w-5 text-red-600' aria-hidden='true' />
										Delete
									</button>
								</div>
							</div>
						</div>
					</li>
				))} */}
			{/* </ul>
			</div> */}

		</div>
	);
}

