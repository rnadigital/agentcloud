import * as API from '@api';
import ParameterForm from 'components/ParameterForm';
import { useAccountContext } from 'context/account';
import useResponsive from 'hooks/useResponsive';
import { Box, CircleChevronLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { Tool, ToolType } from 'struct/tool';

import { toast } from 'react-toastify';
import { DialogFooter } from 'modules/components/ui/dialog';
import { Button } from 'modules/components/ui/button';
export const ToolDisplay = ({
	selectedTool,
	setSelectedTool,
	setDisplayScreen,
	fetchTools,
	setScreen,
	editing,
	compact,
	setDialogScreen,
	callback,
	handleCloseDialog
}: {
	selectedTool: Tool | null;
	setSelectedTool: React.Dispatch<React.SetStateAction<Tool | null>>;
	setDisplayScreen: any;
	fetchTools: any;
	setScreen: React.Dispatch<React.SetStateAction<string>>;
	editing?: boolean;
	compact?: boolean;
	callback?: (toolId: string, tool: Tool) => void;
	handleCloseDialog: () => void;
	setDialogScreen: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const { isMobile } = useResponsive();
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const posthog = usePostHog();

	const initialParameters = selectedTool?.parameters
		? Object.entries(selectedTool.parameters).reduce((acc, entry) => {
				const [parname, par]: any = entry;
				acc.push({ name: parname, description: par });
				return acc;
			}, [])
		: selectedTool?.requiredParameters &&
			Object.entries(selectedTool?.requiredParameters.properties).reduce((acc, entry) => {
				const [parname, par]: any = entry;
				acc.push({ name: parname, description: '' });
				return acc;
			}, []);

	const [parameters, setParameters] = useState(initialParameters);
	const [submitting, setSubmitting] = useState(false);

	async function toolPost() {
		setSubmitting(true);

		const posthogEvent = editing ? 'updateTool' : 'createTool';
		try {
			const body = {
				_csrf: csrf,
				resourceSlug,
				name: selectedTool?.name,
				type: selectedTool?.type,
				data: {
					...selectedTool?.data
				},
				parameters: parameters.reduce((acc, par) => {
					if (par.name.trim().length > 0) {
						acc[par.name.trim()] = par.description;
					}
					return acc;
				}, {}),
				schema: null,
				description: selectedTool?.description,
				linkedToolId: null,
				cloning: selectedTool && !editing
			};
			switch (true) {
				case selectedTool?.type === ToolType.BUILTIN_TOOL:
					//todo: actually validate
					body.linkedToolId = selectedTool?.linkedToolId || selectedTool?._id;
					break;
				default:
					return;
			}

			if (editing) {
				await API.editTool(
					{
						...body,
						toolId: selectedTool?._id
					},
					res => {
						posthog.capture(posthogEvent, {
							name: body.name,
							type: body.type,
							toolId: selectedTool?._id,
							revisionId: selectedTool?.revisionId
						});
						setDisplayScreen('tools');
						toast.success('Tool updated sucessfully');
						fetchTools();
					},
					err => {
						posthog.capture(posthogEvent, {
							name: body.name,
							type: body.type,
							toolId: selectedTool?._id,
							revisionId: selectedTool?.revisionId,
							error: err
						});
						toast.error(err);
						setSubmitting(false);
					},
					compact ? null : router
				);
			} else {
				const addedTool = await API.addTool(
					body,
					() => {
						posthog.capture(posthogEvent, {
							name: body.name,
							type: body.type,
							toolId: selectedTool?._id,
							revisionId: selectedTool?.revisionId
						});
						toast.success('Tool created sucessfully');
						router.push(`/${resourceSlug}/tools`);
					},
					err => {
						posthog.capture(posthogEvent, {
							name: body.name,
							type: body.type,
							toolId: selectedTool?._id,
							revisionId: selectedTool?.revisionId,
							error: err
						});
						toast.error(err);
					},
					compact ? null : router
				);
				callback && addedTool && callback(addedTool._id, body);
			}
		} finally {
			setSubmitting(false); // Set submitting to false
		}
	}
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
						{selectedTool?.name}
					</p>
					<div className='border border-gray-300 bg-gray-50 py-3 px-4 rounded-lg min-h-28'>
						{selectedTool?.description && (
							<p className='text-gray-900 text-sm'>{selectedTool.description}</p>
						)}
					</div>
					{parameters && (
						<ParameterForm
							readonlyKeys={true}
							parameters={parameters}
							setParameters={setParameters}
							title='Required Parameters'
							disableTypes={true}
							hideRequired={true}
							descriptionPlaceholder='Value'
						/>
					)}
					<div className='flex gap-2 mt-4 flex-col lg:flex-row'>
						{/* <div>
							{selectedTool?.tags &&
								selectedTool?.tags?.length > 0 &&
								selectedTool?.tags?.map((tag, index) => (
									<p
										key={index}
										className='py-1 px-2 rounded-full w-fit font-medium text-xs'
										style={{
											color: tag.textColor,
											backgroundColor: tag.backgroundColor
										}}>
										{tag.name}
									</p>
								))}
						</div> */}
						{/* <div className='flex justify-around w-full flex-col lg:flex-row gap-4'>
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
						</div> */}
					</div>
				</div>
			</article>

			<DialogFooter className='sm:space-x-2'>
				<div className='flex w-full justify-between items-center border-t border-gray-200 py-4'>
					<Button
						onClick={handleCloseDialog}
						className='bg-transparent text-foreground hover:bg-transparent hover:text-foreground'
					>
						Cancel
					</Button>
					<Button
						onClick={async () => {
							await toolPost();
							setDialogScreen('installed');
						}}
						className='bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'
					>
						Save
					</Button>
				</div>
			</DialogFooter>
		</section>
	);
};
