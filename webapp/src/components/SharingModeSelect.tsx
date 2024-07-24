import { capitalize } from 'lib/utils/capitalize';
import React from 'react';
import Select from 'react-tailwindcss-select';
import { SharingMode } from 'struct/sharing';
import SelectClassNames from 'styles/SelectClassNames';
const sharingModeOptions = Object.values(SharingMode).map(mode => ({
	label: mode,
	value: mode
}));

const SharingModeSelect = ({ title = 'Sharing Mode', sharingMode, setSharingMode }) => {
	return (
		<div className='sm:col-span-12'>
			<label
				htmlFor='sharingMode'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
			>
				{title}
			</label>
			<div className='mt-2'>
				<Select
					primaryColor={'indigo'}
					classNames={SelectClassNames}
					value={sharingMode ? { label: capitalize(sharingMode), value: sharingMode } : null}
					onChange={(v: any) => {
						setSharingMode(v ? v.value : null);
					}}
					options={sharingModeOptions}
					formatOptionLabel={option => {
						return (
							<li
								className={`capitalize block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
									option.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
								}`}
							>
								{option.label}
							</li>
						);
					}}
				/>
			</div>
		</div>
	);
};

export default SharingModeSelect;
