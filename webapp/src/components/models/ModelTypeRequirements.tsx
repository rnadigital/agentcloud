import { InformationCircleIcon } from '@heroicons/react/20/solid';
import React from 'react';
import Select from 'react-tailwindcss-select';
import { ModelEmbeddingLength, ModelList, ModelTypeRequirements } from 'struct/model';
import { FieldRequirement } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

const ModelTypeRequirementsComponent = ({
	type,
	config,
	setConfig,
	modelFilter = null,
	defaultModel = null
}) => {
	const { requiredFields, optionalFields } = Object.entries(ModelTypeRequirements[type])
		.filter(e => e[1])
		.reduce(
			(acc, x): any => {
				if (x[1]['optional'] === true) {
					acc.optionalFields.push(x);
				} else {
					acc.requiredFields.push(x);
				}
				return acc;
			},
			{ requiredFields: [], optionalFields: [] }
		);
	const renderInput = ([key, req]: [string, FieldRequirement], ei) => {
		return (
			<div key={`modelName_${type}_${ei}`}>
				<label
					htmlFor={key}
					className='capitalize block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
				>
					{key.replaceAll('_', ' ')}
					{req?.tooltip && (
						<span className='ms-1 -mb-0.5 tooltip z-100'>
							<InformationCircleIcon className='h-4 w-4' />
							<span className='tooltiptext text-sm capitalize !w-[200px] !-ml-[100px] whitespace-pre'>
								{req?.tooltip}
							</span>
						</span>
					)}
				</label>
				<div className='mt-2'>
					<input
						type={req.type}
						name={key}
						id={key}
						className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
						onChange={e => setConfig(e.target)}
						required={req?.optional !== true}
						defaultValue={config[key]}
						placeholder={req.placeholder}
						{...(req?.inputProps || {})}
					/>
				</div>
			</div>
		);
	};
	return (
		<>
			{ModelList[type]?.length > 0 && (
				<div className='sm:col-span-12'>
					<label
						htmlFor='model'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
					>
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
									value: v?.value
								});
							}}
							options={
								ModelList &&
								ModelList[type] &&
								ModelList[type]
									.filter(m => {
										if (!modelFilter) {
											return true;
										}
										return modelFilter == 'embedding'
											? ModelEmbeddingLength[m]
											: !ModelEmbeddingLength[m];
									})
									.map(m => ({ label: m, value: m }))
							}
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
			{requiredFields.map(renderInput)}
			{optionalFields.length > 0 && (
				<details className='space-y-4'>
					<summary className='cursor-pointer mb-4'>Optional fields</summary>
					{optionalFields.map(renderInput)}
				</details>
			)}
		</>
	);
};

export default ModelTypeRequirementsComponent;
