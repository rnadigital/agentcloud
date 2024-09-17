import { InformationCircleIcon } from '@heroicons/react/20/solid';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { ModelEmbeddingLength, ModelList, ModelType, ModelTypeRequirements } from 'struct/model';
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
	const [showOther, setShowOther] = useState(false);
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
						className='bg-white dark:bg-slate-800 rounded-md border border-gray-300 dark:border-gray-600 w-full h-9 p-1 pl-3 text-gray-500 dark:text-gray-50 disabled:bg-gray-200 text-sm focus:ring-indigo-600'
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
	const modelOptions =
		ModelList &&
		ModelList[type] &&
		ModelList[type]
			.filter(m => {
				if (!modelFilter) {
					return true;
				}
				return modelFilter == 'embedding' ? ModelEmbeddingLength[m] : !ModelEmbeddingLength[m];
			})
			.filter(m => {
				if (process.env.NEXT_PUBLIC_GCS_BUCKET_NAME === 'agentcloud-public') {
					return !ModelEmbeddingLength[m] || ModelEmbeddingLength[m] === 1536;
				}
				return true;
			})
			.map(m => ({ label: m, value: m }))
			.concat(type === ModelType.OLLAMA ? [{ label: 'Other', value: 'other' }] : []);
	return (
		<>
			{ModelList[type]?.length > 0 && (
				<div className='sm:col-span-12'>
					<label
						htmlFor='model'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'
					>
						Model
					</label>
					<div className='mt-2'>
						<Select
							isClearable
							primaryColor={'indigo'}
							classNames={SelectClassNames}
							value={
								config.model
									? { label: config.model, value: config.model }
									: showOther
										? { label: 'Other', value: 'other' }
										: null
							}
							onChange={(v: any) => {
								if (v?.value === 'other') {
									setConfig({
										name: 'model',
										value: null
									});
									return setShowOther(true);
								}
								setShowOther(false);
								setConfig({
									name: 'model',
									value: v?.value
								});
							}}
							options={modelOptions}
							formatOptionLabel={data => (
								<li
									className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
										data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-gray-50'
									}`}
								>
									{data.label}
								</li>
							)}
						/>
					</div>
				</div>
			)}
			{showOther && renderInput(['model', { type: 'text' }], 0)}
			{requiredFields.map(renderInput)}
			{optionalFields.length > 0 && (
				<details className='space-y-4'>
					<summary className='cursor-pointer mb-4 dark:text-gray-50'>Optional fields</summary>
					{optionalFields.map(renderInput)}
				</details>
			)}
		</>
	);
};

export default ModelTypeRequirementsComponent;
