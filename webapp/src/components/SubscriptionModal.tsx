import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import * as API from '../api';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';

export default function SubscriptionModal() {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();

	const [open, setOpen] = useState(true);

	async function getPaymentLink(e) {
		e.preventDefault();
		API.getPaymentLink({
			_csrf: csrf,
		}, null, null, router);
	}

	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog as='div' className='relative z-10' onClose={setOpen}>
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

				<div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
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
							<Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6'>
								<div>
									<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
										<CreditCardIcon className='h-6 w-6 text-yellow-600' aria-hidden='true' />
									</div>
									<div className='mt-3 text-center sm:mt-5'>
										<Dialog.Title as='h3' className='text-base font-semibold leading-6 text-gray-900'>
											Unlock Sessions
										</Dialog.Title>
										<div className='mt-2'>
											<p className='text-sm text-gray-500'>
												Subscribe to create your unique session today!
											</p>
										</div>
									</div>
								</div>
								<div className='mt-5 sm:mt-6'>
									<button
										type='button'
										className='inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
										onClick={getPaymentLink}
									>
										Subscribe
									</button>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
