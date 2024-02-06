'use strict';

import { Dialog, Menu, Transition } from '@headlessui/react';
import {
	BellIcon,
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';

export default function NotificationBell() {
	//TODO: fetch notifications, display notifications	
	return <Menu as='div' className='relative'>
		<Menu.Button className='-m-1.5 flex items-center'>
			<span className='sr-only'>View notifications</span>
			<BellIcon className='h-6 w-6' aria-hidden='true' />
			<div className='relative -mt-4 -ms-1 inline-flex'>
				<span className='bg-red-500 rounded-full w-2 h-2' />
			</div>
		</Menu.Button>
		<Transition
			as={Fragment}
			enter='transition ease-out duration-100'
			enterFrom='transform opacity-0 scale-95'
			enterTo='transform opacity-100 scale-100'
			leave='transition ease-in duration-75'
			leaveFrom='transform opacity-100 scale-100'
			leaveTo='transform opacity-0 scale-95'
		>
			<Menu.Items className='absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-md bg-white dark:bg-slate-800 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
				<ul>
					<li>TODO: notifications here</li>
				</ul>
			</Menu.Items>
		</Transition>
	</Menu>;
}
