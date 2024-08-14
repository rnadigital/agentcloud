// import { useSortable } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
// import React, { useState } from 'react';

// interface SortableItemProps {
// 	id: string;
// 	config?: FormFieldConfig;
// }

// export interface FormFieldConfig {
// 	type: 'string' | 'number' | 'radio' | 'checkbox' | 'select' | 'multiselect' | 'date';
// 	name: string;
// 	label: string;
// 	description?: string;
// 	required?: boolean;
// 	options?: { value: string; label: string }[];
// 	tooltip?: string;
// }

// const SortableItem: React.FC<SortableItemProps> = ({ id, config }) => {
// 	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
// 	const style = {
// 		transform: CSS.Transform.toString(transform),
// 		transition
// 	};

// 	const [formConfig, setFormConfig] = useState<FormFieldConfig>(config);

// 	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
// 		const { name, value, type } = e.target;
// 		const checked = (e.target as HTMLInputElement).checked;
// 		setFormConfig(prevConfig => ({
// 			...prevConfig,
// 			[name]: type === 'checkbox' ? checked : value
// 		}));
// 	};
// 	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
// 		const { value } = e.target;
// 		setFormConfig(prevConfig => ({
// 			...prevConfig,
// 			type: value as FormFieldConfig['type']
// 		}));
// 	};
// 	const addOption = () => {
// 		setFormConfig(prevConfig => ({
// 			...prevConfig,
// 			options: [...(prevConfig?.options || []), { value: '', label: '' }]
// 		}));
// 	};

// 	return (
// 		<div ref={setNodeRef} style={style} {...attributes} className='bg-white dark:bg-slate-800'>
// 			<div {...listeners} className='cursor-grab flex justify-center p-1 dark:bg-gray-800'>
// 				<div className='grid grid-cols-3 gap-0.5'>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 				</div>
// 			</div>
// 			<select
// 				name='type'
// 				value={formConfig?.type}
// 				onChange={handleTypeChange}
// 				style={{ width: '100%' }}
// 			>
// 				<option value='string'>String</option>
// 				<option value='number'>Number</option>
// 				<option value='radio'>Radio</option>
// 				<option value='checkbox'>Checkbox</option>
// 				<option value='select'>Select</option>
// 				<option value='multiselect'>Multiselect</option>
// 				<option value='date'>Date</option>
// 			</select>
// 			<input
// 				type={formConfig?.type === 'string' ? 'text' : formConfig?.type}
// 				name='label'
// 				value={formConfig?.label}
// 				onChange={handleChange}
// 				placeholder='Label'
// 				required={formConfig?.required}
// 				style={{ width: '100%' }}
// 			/>
// 			<input
// 				type='text'
// 				name='name'
// 				value={formConfig?.name}
// 				onChange={handleChange}
// 				placeholder='Name'
// 				style={{ width: '100%' }}
// 			/>
// 			<input
// 				type='checkbox'
// 				name='required'
// 				checked={formConfig?.required}
// 				onChange={handleChange}
// 			/>{' '}
// 			Required
// 			{formConfig?.description && (
// 				<input
// 					type='text'
// 					name='description'
// 					value={formConfig?.description}
// 					onChange={handleChange}
// 					placeholder='Description'
// 					style={{ width: '100%' }}
// 				/>
// 			)}
// 			{formConfig?.tooltip && (
// 				<input
// 					type='text'
// 					name='tooltip'
// 					value={formConfig?.tooltip}
// 					onChange={handleChange}
// 					placeholder='Tooltip'
// 					style={{ width: '100%' }}
// 				/>
// 			)}
// 			<div>
// 				{formConfig?.options?.map((option, index) => (
// 					<div key={index}>
// 						<input
// 							type='text'
// 							name={`option-${index}-value`}
// 							value={option.value}
// 							onChange={e => {
// 								const newOptions = [...formConfig?.options!];
// 								newOptions[index].value = e.target.value;
// 								setFormConfig(prevConfig => ({
// 									...prevConfig,
// 									options: newOptions
// 								}));
// 							}}
// 							placeholder='Option Value'
// 							style={{ width: '100%' }}
// 						/>
// 						<input
// 							type='text'
// 							name={`option-${index}-label`}
// 							value={option.label}
// 							onChange={e => {
// 								const newOptions = [...formConfig?.options!];
// 								newOptions[index].label = e.target.value;
// 								setFormConfig(prevConfig => ({
// 									...prevConfig,
// 									options: newOptions
// 								}));
// 							}}
// 							placeholder='Option Label'
// 							style={{ width: '100%' }}
// 						/>
// 					</div>
// 				))}

// 				<button
// 					type='button'
// 					onClick={addOption}
// 					className='mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
// 				>
// 					Add Option
// 				</button>
// 			</div>
// 		</div>
// 	);
// };

// export default SortableItem;

// import { useSortable } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
// import React, { useState } from 'react';

// interface SortableItemProps {
// 	id: string;
// 	config?: FormFieldConfig;
// }

// export interface FormFieldConfig {
// 	type: 'string' | 'number' | 'radio' | 'checkbox' | 'select' | 'multiselect' | 'date';
// 	name: string;
// 	label: string;
// 	description?: string;
// 	required?: boolean;
// 	options?: { value: string; label: string }[];
// 	tooltip?: string;
// }

// const SortableItem: React.FC<SortableItemProps> = ({ id, config }) => {
// 	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
// 	const style = {
// 		transform: CSS.Transform.toString(transform),
// 		transition
// 	};

// 	const [formConfig, setFormConfig] = useState<FormFieldConfig>(config);

// 	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
// 		const { name, value, type } = e.target;
// 		const checked = (e.target as HTMLInputElement).checked;
// 		setFormConfig(prevConfig => ({
// 			...prevConfig,
// 			[name]: type === 'checkbox' ? checked : value
// 		}));
// 	};

// 	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
// 		const { value } = e.target;
// 		setFormConfig(prevConfig => ({
// 			...prevConfig,
// 			type: value as FormFieldConfig['type']
// 		}));
// 	};

// 	const addOption = () => {
// 		setFormConfig(prevConfig => ({
// 			...prevConfig,
// 			options: [...(prevConfig?.options || []), { value: '', label: '' }]
// 		}));
// 	};

// 	return (
// 		<div ref={setNodeRef} style={style} {...attributes} className='bg-white dark:bg-slate-800'>
// 			<div {...listeners} className='cursor-grab flex justify-center p-1 dark:bg-gray-800'>
// 				<div className='grid grid-cols-3 gap-0.5'>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 					<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
// 				</div>
// 			</div>
// 			<select
// 				name='type'
// 				value={formConfig?.type}
// 				onChange={handleTypeChange}
// 				style={{ width: '100%' }}
// 			>
// 				<option value='string'>String</option>
// 				<option value='number'>Number</option>
// 				<option value='radio'>Radio</option>
// 				<option value='checkbox'>Checkbox</option>
// 				<option value='select'>Select</option>
// 				<option value='multiselect'>Multiselect</option>
// 				<option value='date'>Date</option>
// 			</select>
// 			<input
// 				type={formConfig?.type === 'string' ? 'text' : formConfig?.type}
// 				name='label'
// 				value={formConfig?.label}
// 				onChange={handleChange}
// 				placeholder='Label'
// 				required={formConfig?.required}
// 				style={{ width: '100%' }}
// 			/>
// 			<input
// 				type='text'
// 				name='name'
// 				value={formConfig?.name}
// 				onChange={handleChange}
// 				placeholder='Name'
// 				style={{ width: '100%' }}
// 			/>
// 			<input
// 				type='checkbox'
// 				name='required'
// 				checked={formConfig?.required}
// 				onChange={handleChange}
// 			/>{' '}
// 			Required
// 			{formConfig?.description && (
// 				<input
// 					type='text'
// 					name='description'
// 					value={formConfig?.description}
// 					onChange={handleChange}
// 					placeholder='Description'
// 					style={{ width: '100%' }}
// 				/>
// 			)}
// 			{formConfig?.tooltip && (
// 				<input
// 					type='text'
// 					name='tooltip'
// 					value={formConfig?.tooltip}
// 					onChange={handleChange}
// 					placeholder='Tooltip'
// 					style={{ width: '100%' }}
// 				/>
// 			)}
// 			<div>
// 				{formConfig?.options?.map((option, index) => (
// 					<div key={index}>
// 						<input
// 							type='text'
// 							name={`option-${index}-value`}
// 							value={option.value}
// 							onChange={e => {
// 								const newOptions = [...formConfig?.options!];
// 								newOptions[index].value = e.target.value;
// 								setFormConfig(prevConfig => ({
// 									...prevConfig,
// 									options: newOptions
// 								}));
// 							}}
// 							placeholder='Option Value'
// 							style={{ width: '100%' }}
// 						/>
// 						<input
// 							type='text'
// 							name={`option-${index}-label`}
// 							value={option.label}
// 							onChange={e => {
// 								const newOptions = [...formConfig?.options!];
// 								newOptions[index].label = e.target.value;
// 								setFormConfig(prevConfig => ({
// 									...prevConfig,
// 									options: newOptions
// 								}));
// 							}}
// 							placeholder='Option Label'
// 							style={{ width: '100%' }}
// 						/>
// 					</div>
// 				))}
// 				<button
// 					type='button'
// 					onClick={addOption}
// 					className='mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
// 				>
// 					Add Option
// 				</button>
// 			</div>
// 		</div>
// 	);
// };

// export default SortableItem;

import React, { CSSProperties, forwardRef } from 'react';
import { FormFieldConfig } from 'struct/task';

interface SortableItemProps {
	id: string;
	config?: FormFieldConfig;
	style?: CSSProperties;
}

const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
	({ id, config, style, ...props }, ref) => {
		return (
			<div ref={ref} key={id} className='bg-white dark:bg-slate-800' style={style} {...props}>
				<div className='cursor-grab flex justify-center p-1 dark:bg-gray-800'>
					<div className='grid grid-cols-3 gap-0.5'>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
					</div>
				</div>
				<select name='type' value={config?.type} style={{ width: '100%' }}>
					<option value='string'>String</option>
					<option value='number'>Number</option>
					<option value='radio'>Radio</option>
					<option value='checkbox'>Checkbox</option>
					<option value='select'>Select</option>
					<option value='multiselect'>Multiselect</option>
					<option value='date'>Date</option>
				</select>
				<input
					type={config?.type === 'string' ? 'text' : config?.type}
					name='label'
					value={config?.label}
					placeholder='Label'
					required={config?.required}
					style={{ width: '100%' }}
				/>
				<input
					type='text'
					name='name'
					value={config?.name}
					placeholder='Name'
					style={{ width: '100%' }}
				/>
				<input type='checkbox' name='required' checked={config?.required} /> Required
				{config?.description && (
					<input
						type='text'
						name='description'
						value={config?.description}
						placeholder='Description'
						style={{ width: '100%' }}
					/>
				)}
				{config?.tooltip && (
					<input
						type='text'
						name='tooltip'
						value={config?.tooltip}
						placeholder='Tooltip'
						style={{ width: '100%' }}
					/>
				)}
				<div>
					{config?.options?.map((option, index) => (
						<div key={index}>
							<input
								type='text'
								name={`option-${index}-value`}
								value={option.value}
								placeholder='Option Value'
								style={{ width: '100%' }}
							/>
							<input
								type='text'
								name={`option-${index}-label`}
								value={option.label}
								placeholder='Option Label'
								style={{ width: '100%' }}
							/>
						</div>
					))}
					<button
						type='button'
						className='mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
					>
						Add Option
					</button>
				</div>
			</div>
		);
	}
);

export default SortableItem;

SortableItem.displayName = 'SortableItem';
