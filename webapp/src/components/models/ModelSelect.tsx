import React, { useEffect,useState } from 'react';
import Select from 'react-tailwindcss-select';
import { ModelEmbeddingLength } from 'struct/model';
import SelectClassNames from 'styles/SelectClassNames';

export default function ModelSelect({ models, modelId, label, onChange, setModalOpen, callbackKey, setCallbackKey }) {
	const foundModel = models.find(m => m._id === modelId);
	return (
		<div className='sm:col-span-12'>
			<label htmlFor='modelId' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
				{label}
			</label>
			<div className='mt-2'>
				<Select
					isClearable
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
					options={models.filter(m => !ModelEmbeddingLength[m.model]).map(c => ({ label: c.name || c._id, value: c._id })).concat([{ label: '+ New model', value: null }])}
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
