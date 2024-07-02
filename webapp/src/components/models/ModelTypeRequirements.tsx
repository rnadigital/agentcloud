import React from 'react';
import Select from 'react-tailwindcss-select';
import { ModelList,ModelTypeRequirements } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

const ModelTypeRequirementsComponent = ({ type, config, setConfig }) => {
	return (
		<>
			{Object.entries(ModelTypeRequirements[type]).filter(e => e[1]).map(([key, req]: any, ei) => (
				<div key={`modelName_${type}_${ei}`}>
					<label htmlFor={key} className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
						{key}
					</label>
					<div className='mt-2'>
						<input
							type='text'
							name={key}
							id={key}
							className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							onChange={e => setConfig(e.target)}
							required={req?.optional !== true}
							defaultValue={config[key]}
						/>
					</div>
				</div>
			))}
			{ModelList[type]?.length > 0 && (
				<div className='sm:col-span-12'>
					<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
						Model
					</label>
					<div className='mt-2'>
						<Select
							isClearable
							primaryColor={'indigo'}
							classNames={SelectClassNames}
							value={config.model ? { label: config.model, value: config.model } : null}
							onChange={(v: any) => {
								setConfig({
									name: 'model',
									value: v?.value,
								});
							}}
							options={ModelList && ModelList[type] && ModelList[type].map(m => ({ label: m, value: m }))}
							formatOptionLabel={data => (
								<li
									className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
										data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
									}`}
								>
									{data.label}
								</li>
							)}
						/>
					</div>
				</div>
			)}
		</>
	);
};

export default ModelTypeRequirementsComponent;
