import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Fragment, useRef, useState } from 'react';

export default function DeleteModal({
	open,
	title,
	message,
	confirmFunction,
	cancelFunction,
	buttonText = 'Delete'
}) {
	const cancelButtonRef = useRef(null);
	return (
		<Transition show={open} as={Fragment}>
			<Dialog
				as='div'
				className='relative z-50'
				initialFocus={cancelButtonRef}
				onClose={cancelFunction}
			>
				<TransitionChild
					as={Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
				</TransitionChild>

				<div className='lg:ms-[144px] fixed inset-0 z-10 w-screen overflow-y-auto'>
					<div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
						<TransitionChild
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						>
							<DialogPanel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 md:min-w-[400px] dark:bg-slate-800'>
								<div className='sm:flex sm:items-start'>
									<div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
										<ExclamationTriangleIcon className='h-6 w-6 text-red-600' aria-hidden='true' />
									</div>
									<div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
										<DialogTitle
											as='h3'
											className='text-base font-semibold leading-6 text-gray-900 dark:text-white'
										>
											{title}
										</DialogTitle>
										<div className='mt-2'>
											<p className='text-sm text-gray-500 dark:text-gray-50'>{message}</p>
										</div>
									</div>
								</div>
								<div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
									<button
										type='button'
										className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto'
										onClick={() => confirmFunction()}
									>
										{buttonText}
									</button>
									<button
										type='button'
										className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto'
										onClick={() => cancelFunction()}
										ref={cancelButtonRef}
									>
										Cancel
									</button>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
