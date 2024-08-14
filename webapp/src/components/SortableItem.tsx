import React, { CSSProperties, forwardRef, useState } from 'react';
import { FormFieldConfig } from 'struct/task';

interface SortableItemProps {
	id: string;
	config?: FormFieldConfig;
	style?: CSSProperties;
	editItem: (id: string, newConfig: FormFieldConfig) => void;

	deleteItem: (id: string) => void;
}

const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
	({ id, config, style, editItem, deleteItem, ...props }, ref) => {
		const [formConfig, setFormConfig] = useState<FormFieldConfig>(config);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const { name, value, type } = e.target;
			const checked = (e.target as HTMLInputElement).checked;
			setFormConfig(prevConfig => {
				const newConfig = {
					...prevConfig,
					[name]: type === 'checkbox' ? checked : value
				};
				editItem(id, newConfig);
				return newConfig;
			});
		};

		const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
			const { value } = e.target;
			setFormConfig(prevConfig => {
				const newConfig = {
					...prevConfig,
					type: value as FormFieldConfig['type']
				};
				editItem(id, newConfig);
				return newConfig;
			});
		};

		const addOption = () => {
			setFormConfig(prevConfig => {
				const newConfig = {
					...prevConfig,
					options: [...(prevConfig?.options || []), { value: '', label: '' }]
				};
				editItem(id, newConfig);
				return newConfig;
			});
		};

		return (
			<div ref={ref} key={id} className='bg-white dark:bg-slate-800' style={style}>
				<div className='cursor-grab flex justify-center p-1 dark:bg-gray-800' {...props}>
					<div className='grid grid-cols-3 gap-0.5'>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
						<div className='w-1 h-1 bg-black dark:bg-white rounded-full'></div>
					</div>
				</div>
				<select
					name='type'
					value={formConfig?.type}
					onChange={handleTypeChange}
					style={{ width: '100%' }}
				>
					<option value='string'>String</option>
					<option value='number'>Number</option>
					<option value='radio'>Radio</option>
					<option value='checkbox'>Checkbox</option>
					<option value='select'>Select</option>
					<option value='multiselect'>Multiselect</option>
					<option value='date'>Date</option>
				</select>
				<input
					type={formConfig?.type === 'string' ? 'text' : formConfig?.type}
					name='label'
					value={formConfig?.label}
					onChange={handleChange}
					placeholder='Label'
					required={formConfig?.required}
					style={{ width: '100%' }}
				/>
				<input
					type='text'
					name='name'
					value={formConfig?.name}
					onChange={handleChange}
					placeholder='Name'
					style={{ width: '100%' }}
				/>
				<input
					type='checkbox'
					name='required'
					checked={formConfig?.required}
					onChange={handleChange}
				/>{' '}
				<div className='inline text-gray-900 dark:text-gray-50'>Required</div>
				{formConfig?.description && (
					<input
						type='text'
						name='description'
						value={formConfig?.description}
						onChange={handleChange}
						placeholder='Description'
						style={{ width: '100%' }}
					/>
				)}
				{formConfig?.tooltip && (
					<input
						type='text'
						name='tooltip'
						value={formConfig?.tooltip}
						onChange={handleChange}
						placeholder='Tooltip'
						style={{ width: '100%' }}
					/>
				)}
				<div>
					{formConfig?.options?.map((option, index) => (
						<div key={index}>
							<input
								type='text'
								name={`option-${index}-value`}
								value={option.value}
								onChange={e => {
									const newOptions = [...formConfig?.options!];
									newOptions[index].value = e.target.value;
									setFormConfig(prevConfig => {
										const newConfig = {
											...prevConfig,
											options: newOptions
										};
										editItem(id, newConfig);
										return newConfig;
									});
								}}
								placeholder='Option Value'
								style={{ width: '100%' }}
							/>
							<input
								type='text'
								name={`option-${index}-label`}
								value={option.label}
								onChange={e => {
									const newOptions = [...formConfig?.options!];
									newOptions[index].label = e.target.value;
									setFormConfig(prevConfig => {
										const newConfig = {
											...prevConfig,
											options: newOptions
										};
										editItem(id, newConfig);
										return newConfig;
									});
								}}
								placeholder='Option Label'
								style={{ width: '100%' }}
							/>
						</div>
					))}
					<button
						type='button'
						onClick={addOption}
						className='mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
					>
						Add Option
					</button>

					<button
						className='mt-2 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
						type='button'
						onClick={() => deleteItem(id)}
					>
						Delete
					</button>
				</div>
			</div>
		);
	}
);

SortableItem.displayName = 'SortableItem';

export default SortableItem;
