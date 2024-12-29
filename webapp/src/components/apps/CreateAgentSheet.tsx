import { dataSourceComboBoxData } from 'data/apps';
import { BookText, ChevronDown, CircleUserRound, Cpu } from 'lucide-react';
import { MultiSelectComboBox } from 'modules/components/multiselect-combobox';
import { Button } from 'modules/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import { Input } from 'modules/components/ui/input';
import { Label } from 'modules/components/ui/label';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from 'modules/components/ui/sheet';
import { Textarea } from 'modules/components/ui/textarea';
import React, { useState } from 'react';

import { ToolsDialogContent } from './ToolsDialogContent';

// import { MultiSelectComboBox } from '../MultiSelectComboBox/multi-select-combobox';

export const CreateAgentSheet = ({ setAgentDisplay, openEditSheet, setOpenEditSheet }: any) => {
	const [toolValue, setToolValue] = useState<string[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	function showPreview(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = e => {
				const previewImage = document.getElementById('preview-image') as HTMLImageElement;
				if (previewImage && e.target?.result) {
					previewImage.src = e.target.result as string;
				}
			};
			reader.readAsDataURL(file);
		}
	}

	return (
		<Sheet open={openEditSheet} onOpenChange={setOpenEditSheet}>
			<SheetTrigger className='font-medium border-0'>
				<div className='w-full flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg'>
					<div className='flex items-center justify-center mb-4'>
						<div className='bg-background w-12 h-12 flex items-center justify-center rounded-full'>
							<CircleUserRound />
						</div>
					</div>
					<div className='flex flex-col items-center gap-2'>
						<p className='font-medium'>+ Create Agent</p>
						<p className='text-gray-500 text-center w-3/5'>
							Think of it as a virtual helper that manages important chats and replies in your app.
						</p>
					</div>
				</div>
			</SheetTrigger>
			<SheetContent className='text-foreground sm:max-w-[576px] overflow-y-auto'>
				<SheetHeader>
					<SheetTitle>
						<div className='flex items-center gap-2'>
							<BookText width={15} />
							<p className='text-sm font-medium text-gray-900 text-sm'>New Agent</p>
						</div>
					</SheetTitle>
					<SheetDescription className='border-t border-gray-200 py-3 px-1'>
						<section className='pb-3 flex flex-col gap-4'>
							<div className='flex justify-between gap-2'>
								<div className='flex flex-col gap-2'>
									<label htmlFor='image-upload' className='cursor-pointer'>
										<div className='w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#4F46E5] transition-colors'>
											<img
												id='preview-image'
												src='/apps/camera-placeholder.png'
												alt='Preview'
												className='w-full h-full object-cover rounded-full'
											/>
										</div>
									</label>
									<input
										id='image-upload'
										type='file'
										accept='image/*'
										className='hidden'
										onChange={e => showPreview(e)}
									/>
								</div>
								<div className='flex flex-col gap-2 justify-center'>
									<p className='bg-gray-100 text-gray-500 rounded-sm p-2 text-sm'>
										Leave blank to auto-generate a profile photo based on the role.
									</p>
									<p className='text-gray-500 text-sm'>Max file size : 1 MB</p>
								</div>
							</div>

							<div className='grid w-full items-center gap-1.5'>
								<Label className='text-gray-900 font-medium' htmlFor='name'>
									Name
								</Label>
								<Input
									className='bg-gray-50 border border-gray-300'
									type='text'
									id='name'
									placeholder='Agent Name'
								/>
							</div>

							<div className='grid w-full items-center gap-1.5'>
								<Label className='text-gray-900 font-medium' htmlFor='role'>
									Role
								</Label>
								<Input
									className='bg-gray-50 border border-gray-300'
									type='text'
									id='role'
									placeholder='e.g. Data Analyst'
								/>
								<div className='flex gap-2 items-center text-xs'>
									<p>Suggestions:</p>
									<div className='flex items-center gap-2'>
										<p className='text-gray-900 py-1 px-2 bg-gray-100 rounded-lg'>
											Technical Support
										</p>
										<p className='text-gray-900 py-1 px-2 bg-gray-100 rounded-lg'>Code Helper</p>
										<p className='text-gray-900 py-1 px-2 bg-gray-100 rounded-lg'>API Integrator</p>
									</div>
								</div>
							</div>

							<div className='grid w-full items-center gap-1.5'>
								<Label className='text-gray-900 font-medium' htmlFor='goal'>
									Goal
								</Label>
								<Textarea
									id='goal'
									className='resize-none h-20 bg-gray-50 border-gray-300'
									placeholder='Extract actionable insights'
								/>
							</div>

							<div className='grid w-full items-center gap-1.5'>
								<Label className='text-gray-900 font-medium' htmlFor='backstory'>
									Backstory
								</Label>
								<Textarea
									id='backstory'
									className='resize-none h-28 bg-gray-50 border-gray-300'
									placeholder="e.g. You're a data analyst at a large company. You're responsible for analyzing data and providing insights to the business. You're currently working on a project to analyze the performance of our marketing campaigns."
								/>
							</div>

							<div className='grid w-full items-center gap-1.5'>
								<DropdownMenu>
									<DropdownMenuTrigger className='bg-background rounded-sm border border-gray-300 flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg'>
										<div className='flex items-center gap-2'>
											<Cpu width={15} />
											<p className='text-sm text-gray-900'>GPT-4o (Open AI)</p>
										</div>
										<ChevronDown width={25} color='#6B7280' />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem>Dropdown Item</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div className='bg-gray-100 p-4 rounded-lg flex flex-col gap-2'>
								<div>
									<h4 className='text-sm text-foreground font-medium'>
										Help Your Agent Work Smarter
									</h4>
									<p className='text-sm text-gray-600'>
										Equip your agent with essential tools and data to perform tasks effectively. The
										right setup ensures accurate results and informed decisions.
									</p>
								</div>

								<div className='flex flex-col gap-4 text-xs'>
									<ToolsDialogContent
										isDialogOpen={isDialogOpen}
										setIsDialogOpen={setIsDialogOpen}
										toolValue={toolValue}
										setToolValue={setToolValue}
									/>
									<MultiSelectComboBox
										options={dataSourceComboBoxData}
										onValueChange={setToolValue}
										defaultValue={toolValue}
										placeholder='Data Sources'
										maxCount={1}
									/>
								</div>
							</div>
						</section>
						<section className='border-t border-gray-200 pt-4 flex justify-between sticky bottom-0 bg-white text-sm'>
							<Button
								onClick={() => setOpenEditSheet(false)}
								className='text-foreground hover:bg-transparent hover:text-foreground p-0 border border-gray-200 py-2.5 px-5 bg-white'
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									setOpenEditSheet(false);
									setAgentDisplay(true);
								}}
								className='bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white font-medium text-sm py-2'
							>
								Save
							</Button>
						</section>
					</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
};
