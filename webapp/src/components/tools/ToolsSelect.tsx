import React, { useEffect,useState } from 'react';
import Select from 'react-tailwindcss-select';
import SelectClassNames from 'styles/SelectClassNames';

export default function ToolsSelect({ tools, initialTools, onChange, setModalOpen }) {
	const [toolState, setToolState] = useState(initialTools || []);

	useEffect(() => {
		onChange(toolState);
	}, [toolState]);

	return (
		<div className='sm:col-span-12'>
			<label htmlFor='toolIds' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
				Tools
			</label>
			<div className='mt-2'>
				<Select
					isMultiple
					isClearable
					primaryColor={'indigo'}
					classNames={SelectClassNames}
					value={toolState}
					onChange={(v: any) => {
						if (v?.value === null) {
							setModalOpen('tool');
							return;
						}
						setToolState(v);
					}}
					options={tools.map(c => ({ label: c.name, value: c._id }))}
					formatOptionLabel={data => {
						const optionCred = tools.find(oc => oc._id === data.value);
						return (
							<li
								className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
									data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
								}`}
							>
								{data.label} {optionCred ? `(${optionCred?.type})` : null}
							</li>
						);
					}}
				/>
			</div>
		</div>
	);
}
