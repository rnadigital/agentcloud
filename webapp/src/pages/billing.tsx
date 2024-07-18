import * as API from '@api';
import { loadStripe } from '@stripe/stripe-js';
import ButtonSpinner from 'components/ButtonSpinner';
import ConfirmModal from 'components/ConfirmModal';
import ErrorAlert from 'components/ErrorAlert';
import InfoAlert from 'components/InfoAlert';
import Invoice from 'components/Invoice';
import Spinner from 'components/Spinner';
import StripeCheckoutModal from 'components/StripeCheckoutModal';
import SubscriptionCard from 'components/SubscriptionCard';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SubscriptionPlan, subscriptionPlans as plans } from 'struct/billing';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
export default function Billing(props) {

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const { stripeCustomerId, stripePlan } = account?.stripe || {};
	const [selectedPlan, setSelectedPlan] = useState(stripePlan);
	const router = useRouter();
	const [_, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;
	const [stagedChange, setStagedChange] = useState(null);
	const [show, setShow] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [continued, setContinued] = useState(false);
	const [last4, setLast4] = useState(null);
	//maybe refactor this into a barrier in _app or just wrapping billing pages/components
	const [missingEnvs, setMissingEnvs] = useState(null);

	const getPayload = () => {
		return {
			_csrf: csrf,
			plan: selectedPlan,
			...(stagedChange?.users ? { users: stagedChange.users } : {}),
			...(stagedChange?.storage ? { storage: stagedChange.storage } : {}),
		};
	};

	// TODO: move this to a lib (IF its useful in other files)
	const stripeMethods = [API.getPortalLink];
	function createApiCallHandler(apiMethod) {
		return async (e) => {
			e.preventDefault();
			const res = await apiMethod({
				_csrf: getPayload()._csrf,
			}, null, toast.error, null);
			if (res.redirect && typeof window !== undefined) {
				window.open(res.redirect, '_blank').focus();
			}
		};
	}
	const [getPortalLink] = stripeMethods.map(createApiCallHandler);

	function fetchAccount() {
		if (resourceSlug) {
			API.getAccount({ resourceSlug }, dispatch, setError, router);
		}
	}

	useEffect(() => {
		API.checkStripeReady(x => {
			setMissingEnvs(x.missingEnvs);
			fetchAccount();
			API.hasPaymentMethod(res => {
				if (res && res?.ok === true && res?.last4) {
					setLast4(res?.last4);
				}
			}, toast.error, router);
		}, toast.error, router);
	}, [resourceSlug]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			refreshAccountContext();
		}, 500);
		return () => {
			clearTimeout(timeout);
		};
	}, [showConfirmModal]);

	useEffect(() => {
		let timeout = setTimeout(() => {
			setShow(stagedChange != null);
		}, 500);
		return () => {
			clearTimeout(timeout);
		};
	}, [stagedChange?.id]);

	if (!account || missingEnvs == null) {
		return <Spinner />;
	}

	if (missingEnvs.length > 0) {
		return (<ErrorAlert error={`Stripe functionality is missing the following:
${missingEnvs.join('\n')}`} />);
	}

	return (
		<>
			<Head>
				<title>Billing</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 mt-2 mb-4'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Manage Subscription</h3>
			</div>
			<InfoAlert
				message='Click the button below to manage or remove payment methods, cancel your subscription, or view invoice history.'
				textColor='blue'
			/>
			<div className='flex flex-row flex-wrap gap-4 mb-6 items-center'>
				<button
					onClick={getPortalLink}
					disabled={!stripeCustomerId}
					className={'mt-2 transition-colors flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-600'}
				>
					Open Customer Portal
				</button>
			</div>

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Plan Selection</h3>
			</div>

			<div className='flex flex-row flex-wrap gap-4 py-4 items-center'>
				{plans.map((plan) => (
					<SubscriptionCard
						key={plan.plan}
						title={plan.title}
						price={plan.price}
						plan={plan.plan}
						isPopular={plan.isPopular}
						link={plan.link}
						storageAddon={plan.storageAddon}
						usersAddon={plan.usersAddon}
						selectedPlan={selectedPlan}
						setSelectedPlan={setSelectedPlan}
						setStagedChange={setStagedChange}
						showConfirmModal={showConfirmModal}
						stripePlan={stripePlan}
					/>
				))}
			</div>

			<ConfirmModal
				open={showConfirmModal}
				setOpen={setShowConfirmModal}
				confirmFunction={async () => {
					await API.confirmChangePlan(getPayload(), res => {
						setTimeout(() => {
							toast.success('Subscription updated successfully');
							setStagedChange(null);
							setShowConfirmModal(false);
							setShowPaymentModal(false);
							setShow(false);
						}, 500);
					}, toast.error, router);
				}}
				cancelFunction={async () => {
					setShowConfirmModal(false);
					setShowPaymentModal(false);
					setShow(false);
					setTimeout(() => setStagedChange(null), 500);
				}}
				title='Confirm Subscription Change'
				message='Are you sure you want to change your subscription? Changes will apply immediately.'
			/>

			<StripeCheckoutModal
				showPaymentModal={showPaymentModal}
				getPayload={getPayload}
				setShow={setShowPaymentModal}
				setStagedChange={setStagedChange}
				onComplete={() => {
					setShowPaymentModal(false);
					API.hasPaymentMethod(res => {
						if (res && res?.ok === true && res?.last4) {
							setLast4(res?.last4);
						}
					}, toast.error, router);
					setContinued(true);
				}}
			/>

			<Invoice
				continued={continued}
				session={stagedChange}
				show={show}
				last4={last4}
				cancelFunction={() => setShow(false)}
				confirmFunction={async () => {
					return new Promise((resolve, reject) => {
						try {
							API.hasPaymentMethod(res => {
								if (res && res?.ok === true) {
									setLast4(res?.last4);
									setContinued(true);
									setShowConfirmModal(true);
								} else {
									resolve(null);
									setShowPaymentModal(true);
								}
							}, toast.error, router);
						} catch (e) {
							console.error(e);
							toast.success('Error updating subscription - please contact support');
							reject(e);
						}
					});
				}}
			/>

		</>
	);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
