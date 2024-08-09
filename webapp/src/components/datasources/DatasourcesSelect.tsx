import formatDatasourceOptionLabel from 'components/FormatDatasourceOptionLabel';
import React from 'react';
import Select from 'react-tailwindcss-select';

export default function DatasourceSelector({
	datasourceState,
	setDatasourceState,
	datasources,
	addNewCallback
}) {
	return (
		<div className='sm:col-span-12'>
			<label className='block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50'>
				Datasource
			</label>
			<div className='mt-2'>
				<Select
					isSearchable
					isClearable
					primaryColor={'indigo'}
					classNames={{
						menuButton: () =>
							'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
						menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
						list: 'dark:bg-slate-700',
						listGroupLabel: 'dark:bg-slate-700',
						listItem: (value?: { isSelected?: boolean }) =>
							`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`
					}}
					value={datasourceState}
					onChange={(v: any) => {
						if (v?.value === null) {
							// Create new pressed
							return addNewCallback && addNewCallback('datasource');
						}
						setDatasourceState(v);
					}}
					options={[{ label: '+ New Datasource', value: null }].concat(
						datasources.map(t => ({ label: `${t.name} (${t.originalName})`, value: t._id, ...t }))
					)}
					formatOptionLabel={formatDatasourceOptionLabel}
				/>
			</div>
		</div>
	);
}
