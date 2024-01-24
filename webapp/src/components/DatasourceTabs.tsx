'use strict';

import { ClockIcon, Cog6ToothIcon,TableCellsIcon } from '@heroicons/react/20/solid';

const tabs = [
	{ name: 'Streams', href: '#', icon: TableCellsIcon },
	{ name: 'Job History', href: '#', icon: ClockIcon },
	{ name: 'Settings', href: '#', icon: Cog6ToothIcon },
];

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function DatasourceTabs({ callback, current }) {
	return (
		<div>
			<div className='sm:hidden'>
				<select
					onClick={(e: any) => callback(e?.target?.value)}
					id='tabs'
					name='tabs'
					className='block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
					defaultValue={current}
				>
					{tabs.map((tab, ti) => (
						<option value={ti} key={tab.name}>{tab.name}</option>
					))}
				</select>
			</div>
			<div className='hidden sm:block'>
				<div className='border-b border-gray-200'>
					<nav className='-mb-px flex space-x-8' aria-label='Tabs'>
						{tabs.map((tab, ti) => (
							<span
								key={tab.name}
								onClick={() => callback(ti)}
								className={classNames(
									current === ti
										? 'border-indigo-500 text-indigo-600'
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
									'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium cursor-pointer'
								)}
								aria-current={current === ti ? 'page' : undefined}
							>
								<tab.icon
									className={classNames(
										current === ti ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
										'-ml-0.5 mr-2 h-5 w-5'
									)}
									aria-hidden='true'
								/>
								<span>{tab.name}</span>
							</span>
						))}
					</nav>
				</div>
			</div>
		</div>
	);
}
