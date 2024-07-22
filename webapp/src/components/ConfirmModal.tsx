'use strict';

import { Dialog, Transition } from '@headlessui/react';
import ButtonSpinner from 'components/ButtonSpinner';
import { Fragment, useState } from 'react';

export default function ConfirmModal({
	open,
	setOpen,
	confirmFunction,
	cancelFunction,
	title,
	message
}) {
	const [submitting, setSubmitting] = useState(false);
	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog as='div' className='relative z-50' onClose={setOpen}>
				<Transition.Child
					as={Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
				</Transition.Child>

				<div className='lg:ms-[144px] fixed inset-0 z-10 overflow-y-auto'>
					<div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
						<Transition.Child
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						>
							<Dialog.Panel className='relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 sm:w-full sm:max-w-lg sm:p-6 md:min-w-[400px]'>
								<div>
									<Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900'>
										{title}
									</Dialog.Title>
									<div className='mt-2'>
										<p className='text-sm text-gray-500'>{message}</p>
									</div>
									<div className='mt-4 flex justify-end space-x-2'>
										<button
											type='button'
											className='inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 sm:ml-3 sm:w-auto'
											onClick={() => {
												setSubmitting(false);
												cancelFunction();
											}}
										>
											Cancel
										</button>
										<button
											type='button'
											className='inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto'
											onClick={async () => {
												setSubmitting(true);
												try {
													await confirmFunction();
												} finally {
													setTimeout(() => setSubmitting(false), 1000);
												}
											}}
										>
											{submitting && <ButtonSpinner className='mt-0.5 me-2' />}
											Confirm
										</button>
									</div>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
