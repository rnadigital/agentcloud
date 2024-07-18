import React from 'react';
import Select from 'react-tailwindcss-select';
import { SharingMode } from 'struct/sharing';
import SelectClassNames from 'styles/SelectClassNames';
const sharingModeOptions = Object.values(SharingMode).map(mode => ({
	label: mode,
	value: mode,
}));

const SharingModeSelect = ({ title='Sharing Mode', sharingMode, setSharingMode }) => {
	return (
		<div className='sm:col-span-12'>
			<label htmlFor='sharingMode' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
				{title}
			</label>
			<div className='mt-2'>
				<Select
					primaryColor={'indigo'}
					classNames={SelectClassNames}
					value={sharingMode ? { label: sharingMode, value: sharingMode } : null}
					onChange={(v: any) => {
						setSharingMode(v ? v.value : null);
					}}
					options={sharingModeOptions}
				/>
			</div>
		</div>
	);
};

export default SharingModeSelect;
