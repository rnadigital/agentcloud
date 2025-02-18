import { TrashIcon } from '@heroicons/react/20/solid';
import cn from 'utils/cn';
import React from 'react';

export default function ParameterForm({
	parameters,
	setParameters,
	readonlyKeys = false,
	readonlyValues = false,
	title = 'Parameters',
	disableTypes = false,
	disableDescription = false,
	hideRequired = false,
	namePlaceholder = 'Name',
	descriptionPlaceholder = 'Description',
	namePattern = null,
	descriptionPattern = null,
	addButtonText = 'Add Parameter'
}) {
	const addParameter = () => {
		setParameters([...parameters, { name: '', type: '', description: '', required: false }]);
	};

	const updateParameter = (index, field, value) => {
		const newParameters = parameters?.map((param, i) => {
			if (i === index) {
				return { ...param, [field]: value };
			}
			return param;
		});
		setParameters(newParameters);
	};

	const removeParameter = index => {
		setParameters(parameters.filter((_, i) => i !== index));
	};

	return (
		<div className='mb-0'>
			{title && <label className='text-base font-semibold text-gray-900'>{title}</label>}
			{parameters?.map((param, index) => (
				<div key={index} className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
					<input
						readOnly={readonlyKeys}
						type='text'
						placeholder={namePlaceholder}
						pattern={namePattern}
						value={param.name}
						required
						onChange={e => updateParameter(index, 'name', e.target.value)}
						className={cn(
							'bg-white dark:bg-slate-800 rounded-md border border-gray-300 dark:border-gray-600 w-full h-9 p-1 pl-3 text-gray-500 dark:text-white disabled:bg-gray-200 text-sm focus:ring-indigo-600',
							{ 'col-span-3': disableDescription }
						)}
					/>
					{!disableTypes && (
						<select
							disabled={readonlyKeys}
							value={param.type}
							onChange={e => updateParameter(index, 'type', e.target.value)}
							className='rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
						>
							<option value=''>Select Type</option>
							<option value='string'>String</option>
							<option value='integer'>Number</option>
							<option value='boolean'>Boolean</option>
							{/* Add more types as needed */}
						</select>
					)}
					{!disableDescription && (
						<input
							readOnly={readonlyValues}
							type='text'
							placeholder={descriptionPlaceholder}
							pattern={descriptionPattern}
							value={param.description}
							required
							onChange={e => updateParameter(index, 'description', e.target.value)}
							className='col-span-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
						/>
					)}
					<div className='col-span-1 flex justify-between items-center'>
						{!hideRequired && (
							<label className='flex items-center space-x-2'>
								<input
									disabled={readonlyKeys}
									type='checkbox'
									checked={param.required}
									onChange={e => updateParameter(index, 'required', e.target.checked)}
									className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'
								/>
								<span>Required</span>
							</label>
						)}
						{!readonlyKeys && (
							<button
								type='button'
								onClick={() => removeParameter(index)}
								className='text-red-500 hover:text-red-700'
							>
								<TrashIcon className='h-5' />
							</button>
						)}
					</div>
				</div>
			))}
			{!readonlyKeys && (
				<div className='flex justify-between mt-4'>
					<button
						type='button'
						onClick={addParameter}
						className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						{addButtonText}
					</button>
				</div>
			)}
		</div>
	);
}
