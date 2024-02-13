'use strict';

import * as API from '@api';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
	BugAntIcon,
	XMarkIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Fragment, useEffect,useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export default function DebugLogs() {
	const [open, setOpen] = useState(false);
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
	return (<>
		<Menu as='div' className='ms-3'>
			<Menu.Button className='-m-1.5 flex items-center' onClick={() => setOpen(oldOpen => !oldOpen)}>
				<span className='sr-only'>Debug logs</span>
				<BugAntIcon className='h-6 w-6' aria-hidden='true' />
			</Menu.Button>
		</Menu>
		<Transition.Root show={open} as={Fragment}>

			<Dialog as='div' className='relative' onClose={setOpen}>
				<div className='fixed inset-0' />

				<div className='fixed inset-0 overflow-hidden'>
					<div className='absolute inset-0 overflow-hidden'>
						<div className='fixed inset-y-0 right-0 top-[50px] flex max-w-full pl-10 sm:pl-16'>
							<Transition.Child
								as={Fragment}
								enter='transform transition ease-in-out duration-500 sm:duration-700'
								enterFrom='translate-x-full'
								enterTo='translate-x-0'
								leave='transform transition ease-in-out duration-500 sm:duration-700'
								leaveFrom='translate-x-0'
								leaveTo='translate-x-full'
							>
								<Dialog.Panel className='pointer-events-auto w-screen max-w-2xl'>
									<div className='flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl'>
										<div className='px-4 sm:px-6'>
											<div className='flex items-start justify-between'>
												<Dialog.Title className='text-base font-semibold leading-6 text-gray-900'>
													Developer Logs
												</Dialog.Title>
												<div className='ml-3 flex h-7 items-center'>
													<button
														type='button'
														className='relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
														onClick={() => setOpen(false)}
													>
														<span className='absolute -inset-2.5' />
														<span className='sr-only'>Close panel</span>
														<XMarkIcon className='h-6 w-6' aria-hidden='true' />
													</button>
												</div>
											</div>
										</div>
										<pre className='relative mt-6 flex-1 px-4 sm:px-6'>
											{dockerLogs?.logs}
										</pre>
									</div>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	</>);
}
