import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { ModelEmbeddingLength } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

export default function ModelSelect({
	models,
	modelId,
	label,
	onChange,
	setModalOpen,
	callbackKey,
	setCallbackKey,
	modelFilter = null,
	modelTypeFilters = []
}) {
	const foundModel = models.find(m => m._id === modelId);
	const filteredModels = models
		.filter(m => {
			//Filter by llm vs embedding
			if (!modelFilter) {
				return true;
			}
			if (typeof m === 'string') {
				return modelFilter == 'embedding' ? ModelEmbeddingLength[m] : !ModelEmbeddingLength[m];
			}
			return modelFilter === m?.modelType;
		})
		.filter(m => {
			//filter by type
			if (process.env.NEXT_PUBLIC_GCS_BUCKET_NAME === 'agentcloud-public') {
				return !ModelEmbeddingLength[m.name] || ModelEmbeddingLength[m.name] === 1536;
			}
			return modelTypeFilters.length === 0 || modelTypeFilters.includes(m.type);
		});
	return (
		<div className='sm:col-span-12'>
			<label
				htmlFor='modelId'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
			>
				{label}
			</label>
			<div className='mt-2'>
				<Select
					isClearable
					isSearchable
					primaryColor={'indigo'}
					classNames={SelectClassNames}
					value={foundModel ? { label: foundModel.name, value: foundModel._id } : null}
					onChange={(v: any) => {
						if (v?.value === null) {
							setModalOpen('model');
							setCallbackKey && setCallbackKey(callbackKey);
							return;
						}
						onChange(v);
					}}
					options={[{ label: '+ New model', value: null }].concat(
						filteredModels.map(c => ({ label: c.name || c._id || '', value: c._id || '' }))
					)}
					formatOptionLabel={data => {
						const optionCred = models.find(oc => oc._id === data.value);
						return (
							<li
								className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
									data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
								}`}
							>
								{data?.label} {optionCred ? `(${optionCred?.model})` : null}
							</li>
						);
					}}
				/>
			</div>
		</div>
	);
}
