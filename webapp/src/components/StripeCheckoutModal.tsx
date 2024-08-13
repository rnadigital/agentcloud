import * as API from '@api';
import { Dialog, Transition } from '@headlessui/react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { Fragment, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const StripeCheckoutModal = ({
	showPaymentModal,
	payload,
	setShow,
	setStagedChange,
	onComplete
}) => {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const router = useRouter();
	const cancelButtonRef = useRef(null);

	const fetchClientSecret = useCallback(() => {
		return new Promise((resolve, reject) => {
			API.confirmChangePlan(
				payload,
				res => {
					if (res?.clientSecret) {
						resolve(res.clientSecret);
					}
					reject(null);
				},
				reject,
				router
			);
		});
	}, [payload]);

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
					<div className='flex min-h-full items-end justify-center m-0 p-0 text-center sm:items-center'>
						<Transition.Child
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						>
							<Dialog.Panel className='transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-[400px]'>
								<EmbeddedCheckoutProvider
									stripe={stripePromise}
									options={{
										// @ts-ignore
										fetchClientSecret,
										onComplete
									}}
								>
									<EmbeddedCheckout />
								</EmbeddedCheckoutProvider>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
};

export default StripeCheckoutModal;
