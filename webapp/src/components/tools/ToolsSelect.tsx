import { ArrowPathIcon } from '@heroicons/react/20/solid';
import ToolSelectIcons from 'components/ToolSelectIcons';
import ToolStateBadge from 'components/ToolStateBadge';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { Tool, ToolState } from 'struct/tool';
import SelectClassNames from 'styles/SelectClassNames';

export default function ToolsSelect({
	title = 'Tools',
	addNewTitle = '+ New Tool',
	tools,
	toolState,
	onChange,
	setModalOpen,
	enableAddNew = true
}) {
	tools = tools.filter((t: Tool) => !t?.data?.builtin || !t?.requiredParameters);
	return (
		<div className='sm:col-span-12'>
			<label
				htmlFor='toolIds'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
			>
				{title}
			</label>
			<div className='mt-2'>
				<Select
					isSearchable
					isClearable
					isMultiple
					primaryColor={'indigo'}
					classNames={SelectClassNames}
					value={toolState}
					onChange={(v: any) => {
						// if (v?.some(val => val?.disabled)) { return; }
						if (v?.some(val => val.value === null)) {
							setModalOpen('tool');
							return;
						}
						onChange(v);
					}}
					options={(enableAddNew
						? [
								{
									label: addNewTitle,
									value: null,
									disabled: false
								}
							]
						: []
					).concat(
						tools.map(tool => ({
							label: tool.name,
							value: tool._id,
							disabled: false //tool.state && tool.state !== 'READY',
						}))
					)}
					formatOptionLabel={data => {
						const optionTool = tools.find(tool => tool._id === data.value);
						const isReady = true; //!optionTool?.state || optionTool?.state as ToolState === ToolState.READY;
						return (
							<li
								className={`flex align-items-center !overflow-visible transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
									data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
								} ${optionTool?.state && !isReady ? 'cursor-not-allowed pointer-events-none opacity-50' : ''}`}
							>
								<span className='tooltip z-100'>
									{/* Replace ToolSelectIcons with appropriate icon component */}
									{ToolSelectIcons[optionTool?.type]}
									<span className='tooltiptext capitalize !w-[120px] !-ml-[60px]'>
										{optionTool?.type} tool
									</span>
								</span>
								{optionTool?.state && (
									<span className='ms-2'>
										<ToolStateBadge state={optionTool.state} />
									</span>
								)}
								<span className='ms-2 w-full overflow-hidden text-ellipsis'>
									{data.label}
									{optionTool
										? ` - ${optionTool?.data?.description || optionTool?.description}`
										: ''}
								</span>
							</li>
						);
					}}
				/>
			</div>
		</div>
	);
}
