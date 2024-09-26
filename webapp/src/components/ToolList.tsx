import * as API from '@api';
import { DocumentDuplicateIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import DevBadge from 'components/DevBadge';
import ToolStateBadge from 'components/ToolStateBadge';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Tool, ToolState, ToolType } from 'struct/tool';

import AgentAvatar from './AgentAvatar';

export default function ToolList({ tools, fetchTools }: { tools: Tool[]; fetchTools: Function }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

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
		<ul role='list' className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
			{tools
				.sort((a, b) =>
					a?.data?.builtin && !b?.data?.builtin ? 1 : !a?.data?.builtin && b?.data?.builtin ? -1 : 0
				)
				.map(tool => (
					<li
						key={tool._id.toString()}
						className='col-span-1 divide-y divide-gray-200 dark:divide-slate-600 rounded-lg bg-white shadow dark:bg-slate-800 dark:border dark:border-slate-600 flex flex-col justify-between'
					>
						<div className='flex w-full items-center justify-between space-x-6 p-6 mt-auto mb-auto'>
							<div className='flex-1 truncate'>
								<div className='flex items-center space-x-3'>
									<h3 className='truncate text-sm font-medium text-gray-900 dark:text-white'>
										{tool.name}
									</h3>
									{tool.linkedToolId && (
										<span className='h-6 px-2 py-[0.5px] border text-sm rounded-lg bg-blue-100 text-blue-800 border-blue-300'>
											Installed Tool
										</span>
									)}
								</div>
								<DevBadge label='Tool ID' value={tool?._id?.toString()} />
								<p className='my-1 truncate text-sm text-gray-500 dark:text-slate-400'>
									{tool.type} - {tool?.data?.description || tool?.description}
								</p>
								{tool?.type === ToolType.FUNCTION_TOOL && !tool?.linkedToolId && tool?.state && (
									<ToolStateBadge state={tool.state} />
								)}
							</div>
							<div className='h-10 w-10 flex-shrink-0 rounded-full bg-gray-300 dark:bg-slate-700 text-center text-xl font-bold overflow-hidden'>
								{tool?.icon?.id ? (
									<AgentAvatar agent={tool} fill={true} />
								) : (
									<span className='flex justify-center pt-1'>
										{tool.name.charAt(0).toUpperCase()}
									</span>
								)}
							</div>
						</div>
						{!tool?.data?.builtin && (
							<div>
								<div className='-mt-px flex divide-x divide-gray-200 dark:divide-slate-600'>
									<div className='flex w-0 flex-1'>
										<a
											href={`/${resourceSlug}/tool/${tool._id}/edit`}
											className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white'
										>
											<PencilIcon
												className='h-5 w-5 text-gray-400 dark:text-white'
												aria-hidden='true'
											/>
											Edit
										</a>
									</div>
									<div className='flex w-0 flex-1'>
										<a
											href={`/${resourceSlug}/tool/add?toolId=${encodeURIComponent(tool._id.toString())}`}
											className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white'
										>
											<DocumentDuplicateIcon
												className='h-5 w-5 text-gray-400 dark:text-white'
												aria-hidden='true'
											/>
											Clone
										</a>
									</div>
									<div className='-ml-px flex w-0 flex-1'>
										<button
											onClick={e => {
												posthog.capture('deleteTool', {
													name: tool.name,
													type: tool.type,
													toolId: tool._id,
													revisionId: tool?.revisionId
												});
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
						)}
						{tool?.requiredParameters && tool?.data?.builtin && (
							<div>
								<div className='-mt-px flex divide-x divide-gray-200 dark:divide-slate-600'>
									<div className='flex w-0 flex-1'>
										<a
											href={`/${resourceSlug}/tool/add?toolId=${encodeURIComponent(tool._id.toString())}`}
											className='relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white'
										>
											<PlusIcon
												className='h-5 w-5 text-gray-400 dark:text-white'
												aria-hidden='true'
											/>
											Install
										</a>
									</div>
								</div>
							</div>
						)}
					</li>
				))}
		</ul>
	);
}
