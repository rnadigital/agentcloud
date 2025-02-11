import cn from 'utils/cn';

const SelectClassNames = {
	menuButton: ({ isDisabled }) =>
		cn(
			'flex text-sm text-gray-500 dark:text-gray-50 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
			{ 'bg-gray-300': isDisabled }
		),
	menu: 'absolute z-10 w-full bg-white shadow-lg border roundedu py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600 disabled:bg-red-500',
	list: 'dark:bg-slate-700 rounded',
	listGroupLabel: 'dark:bg-slate-700',
	listItem: (value?: { isSelected?: boolean }) =>
		`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`
};
export default SelectClassNames;
export const SelectClassNamesInverted = {
	...SelectClassNames,
	menu: SelectClassNames.menu + ' invert-menu'
};
