import AvatarUploader from 'components/AvatarUploader';
import React from 'react';
import { ToolType } from 'struct/tool';

export default function ToolDetailsForm({
	toolName,
	setToolName,
	toolType,
	setToolType,
	toolDescription,
	setToolDescription,
	isBuiltin,
	initialType,
	icon,
	iconCallback
}) {
	return (
		<>
			<div className='sm:col-span-12'>
				<label
					htmlFor='name'
					className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'>
					Avatar
				</label>
				<div className='mt-2'>
					<AvatarUploader
						existingAvatar={icon}
						callback={iconCallback}
						isDialogOpen={false}
						setIsDialogOpen={() => {}}
					/>
				</div>
			</div>
			<div>
				<label className='text-base font-semibold text-gray-900 dark:text-gray-50'>Name</label>
				<div>
					<input
						required
						readOnly={isBuiltin}
						type='text'
						name='toolName'
						className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-gray-50 mt-2'
						onChange={e => setToolName(e.target.value)}
						value={toolName}
					/>
				</div>
			</div>

			{!isBuiltin && !initialType && (
				<div>
					<label className='text-base font-semibold text-gray-900 dark:text-gray-50'>
						Tool Type
					</label>
					<div>
						<select
							required
							name='toolType'
							className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-gray-50 mt-2'
							value={toolType}
							onChange={e => setToolType(e.target.value as ToolType)}>
							<option value={ToolType.RAG_TOOL}>Datasource RAG</option>
							<option value={ToolType.FUNCTION_TOOL}>Custom code</option>
						</select>
					</div>
				</div>
			)}

			<div>
				<label className='text-base font-semibold text-gray-900 dark:text-gray-50'>
					Description
				</label>
				<p className='text-sm dark:text-gray-50'>
					<strong>Tip:</strong> A verbose and detailed description helps agents to better understand
					when to use this tool.
				</p>
				<div>
					<textarea
						required
						readOnly={isBuiltin}
						name='toolDescription'
						className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-gray-50 mt-2'
						onChange={e => setToolDescription(e.target.value)}
						rows={3}
						value={toolDescription}
					/>
				</div>
			</div>
		</>
	);
}
