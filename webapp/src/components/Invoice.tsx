import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Fragment, useRef, useState } from 'react';

const Invoice = ({ session, show, cancelFunction, confirmFunction }) => {

	const lineItems = session?.line_items?.data;

	const formatCurrency = (amount) => {
		return (amount / 100).toFixed(2);
	};

	const calculateTotal = () => {
		return lineItems?.reduce((total, item) => total + item.amount_total, 0);
	};

	const cancelButtonRef = useRef(null);

	return (
		<Transition.Root show={show===true} as={Fragment}>
			<Dialog as='div' className='relative z-50' initialFocus={cancelButtonRef} onClose={cancelFunction}>
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

				<div className='lg:ms-[144px] fixed inset-0 z-10 w-screen overflow-y-auto'>
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
							<Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 md:min-w-[400px]'>
								<div className='mb-6'>
									<div className='mt-3 text-center w-full'>
										<Dialog.Title as='h3' className='text-base font-semibold leading-6 text-gray-900'>
											Checkout Summary
										</Dialog.Title>
										<div className='mt-2'>
											<div className='dark:bg-gray-900'>
												<ul className='bg-white shadow-md rounded-lg divide-y dark:bg-gray-800 dark:divide-gray-700'>
													{lineItems?.map((item) => (
														<li key={item.id} className='p-4 flex justify-between dark:text-indigo-300'>
															<span>{item.quantity} x {item.description}</span>
															<span>${formatCurrency(item.amount_total)}</span>
														</li>
													))}
												</ul>
												<div className='mt-4 p-4 bg-white shadow-md rounded-lg flex justify-between dark:bg-gray-800 dark:text-indigo-300'>
													<span className='font-bold'>Total</span>
													<span className='font-bold'>${formatCurrency(calculateTotal())}</span>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse justify-between'>
									<button
										type='button'
										className='inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto'
										onClick={() => confirmFunction()}
									>
										Confirm
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
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
};

export default Invoice;
