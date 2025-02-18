import * as API from '@api';
import { DocumentDuplicateIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import DevBadge from 'components/DevBadge';
import ToolStateBadge from 'components/ToolStateBadge';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Tool, ToolState, ToolType } from 'struct/tool';

import AgentAvatar from './AgentAvatar';
import { Search } from 'lucide-react';
import { Input } from 'modules/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from 'modules/components/ui/tabs';
import { ToolsMytools } from './tools/tools-mytools';
import { ToolsLibrary } from './tools/tools-library';

export default function ToolList2({ tools, fetchTools }: { tools: Tool[]; fetchTools: Function }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

	const [filteredTools, setFilteredTools] = useState(tools);
	const [activeTab, setActiveTab] = useState('tool-library');

	useEffect(() => {
		const filteredTools = tools.filter(tool => {
			return tool.type !== ToolType.RAG_TOOL;
		});
		if (tools) {
			setFilteredTools(filteredTools);
		}
	}, [tools]);

	async function deleteTool(toolId) {
		API.deleteTool(
			{
				_csrf: csrf,
				resourceSlug,
				toolId
			},
			() => {
				fetchTools();
				toast('Deleted tool');
			},
			error => {
				toast.error(error || 'Error deleting tool', {
					autoClose: 10000 //Long error text, TODO have a different way of showing this?
				});
			},
			router
		);
	}

	return (
		<main className='text-foreground flex flex-col gap-2'>
			<section className='flex items-center justify-between mb-4'>
				<h4 className='text-gray-900 font-semibold text-2xl'>Tools</h4>
				<div className='flex items-center gap-2'>
					<div className='flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-4 py-1'>
						<Search width={15} />
						<Input
							placeholder='Search Tool'
							className=' border-0 shadow-none focus-visible:ring-offset-0 focus-visible:ring-0 p-0 h-auto bg-transparent'
						/>
					</div>
				</div>
			</section>
			<section>
				<Tabs defaultValue='tool-library' className='mt-4 w-full' value={activeTab}>
					<TabsList className='bg-transparent p-0 flex items-center'>
						<TabsTrigger
							className='w-fit text-gray-500 bg-transparent'
							variant='underline'
							value='my-tools'
							onClick={() => setActiveTab('my-tools')}
						>
							My Tools
						</TabsTrigger>
						<TabsTrigger
							className='w-fit text-gray-500 bg-transparent'
							variant='underline'
							value='tool-library'
							onClick={() => setActiveTab('tool-library')}
						>
							Tool Library
						</TabsTrigger>
					</TabsList>
					<ToolsMytools tools={filteredTools} fetchTools={fetchTools} setActiveTab={setActiveTab} />
					<ToolsLibrary tools={filteredTools} fetchTools={fetchTools} setActiveTab={setActiveTab} />
				</Tabs>
			</section>
		</main>
	);
}
