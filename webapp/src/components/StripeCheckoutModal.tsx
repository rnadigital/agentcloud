import { Dialog, Transition } from '@headlessui/react';
import { useCallback, Fragment, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import * as API from '@api';
import {
	EmbeddedCheckoutProvider,
	EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/router';
import { useAccountContext } from 'context/account';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const StripeCheckoutModal = ({
	showPaymentModal,
	getPayload,
	setShow,
	setStagedChange,
}) => {

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const router = useRouter();
	const cancelButtonRef = useRef(null);

	const fetchClientSecret = useCallback(() => {
		return new Promise((resolve, reject) => {
			API.confirmChangePlan(getPayload(), res => {
				// setShow(false);
				// setStagedChange(null);
				// refreshAccountContext();
				if (res?.clientSecret) {
					resolve(res.clientSecret);
				}
				reject(null);
			}, reject, router);
		});
	});

	const onComplete = () => {
		API.confirmChangePlan(getPayload(), res => {
			if (res?.clientSecret) {
				return toast.error('Payment method update failed - please contact support');
			}
			setShow(false);
			setStagedChange(null);
			refreshAccountContext();
			toast.success('Subscription updated successfully');
		}, toast.error, router);
	};

	return (
		<Transition.Root show={showPaymentModal === true} as={Fragment}>
			<Dialog
				as='div'
				className='relative z-50'
				initialFocus={cancelButtonRef}
				onClose={() => setShow(false)}
			>
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
								<EmbeddedCheckoutProvider
									stripe={stripePromise}
									options={{
										fetchClientSecret,
										onComplete,
									}}
								>
									<EmbeddedCheckout />
								</EmbeddedCheckoutProvider>
								<div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse justify-between'>
									<button
										type='button'
										className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto'
										onClick={() => setShow(false)}
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

export default StripeCheckoutModal;
