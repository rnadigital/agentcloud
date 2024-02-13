'use strict';

import * as API from '@api';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
	BugAntIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Fragment, useEffect,useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export default function DebugLogs() {

	const router = useRouter();
	const { resourceSlug } = router.query;
	const [dockerLogs, setDockerLogs] = useState(null);
	async function fetchDockerLogs() {
		await API.getDockerLogs(setDockerLogs, null, null);
	}

	useEffect(() => {
		fetchDockerLogs();
		// const t = setInterval(fetchDockerLogs, 2000);
		// return () => clearInterval(t);
	}, []);

	return <Menu as='div' className='ms-3'>
		<Menu.Button className='-m-1.5 flex items-center'>
			<span className='sr-only'>Debug logs</span>
			<BugAntIcon className='h-6 w-6' aria-hidden='true' />
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
			<Menu.Items as='pre' className='absolute h-screen w-full inset-1 bg-white shadow-lg rounded-md overflow-auto'>
				{dockerLogs?.logs}
			</Menu.Items>
		</Transition>
	</Menu>;
}
