import * as API from '@api';
import { loadStripe } from '@stripe/stripe-js';
import ButtonSpinner from 'components/ButtonSpinner';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SubscriptionPlan, subscriptionPlans as plans } from 'struct/billing';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
import classNames from 'components//ClassNames';
import StripeCheckoutModal from 'components/StripeCheckoutModal';
import cn from 'utils/cn';

export default function SubscriptionCard({
	title,
	link = null,
	plan = null,
	price = null,
	description = null,
	icon = null,
	isPopular = false,
	selectedPlan,
	setSelectedPlan,
	usersAddon,
	storageAddon,
	setStagedChange,
	showConfirmModal,
	stripePlan
}) {
	const router = useRouter();
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const { stripeEndsAt, stripeTrial, stripeAddons, stripeCancelled } = account?.stripe || {};
	const currentPlan = plan === stripePlan;
	const isEnterprise = plan === SubscriptionPlan.ENTERPRISE;
	const [editedAddons, setEditedAddons] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	//Set addon state to initial value from stripeAddons
	const [addons, setAddons] = useState({
		users: currentPlan ? stripeAddons?.users : 0,
		storage: currentPlan ? stripeAddons?.storage : 0
	});

	//When changing them, check whether edited from the initial state
	useEffect(() => {
		const edited = addons?.users != stripeAddons.users || addons?.storage != stripeAddons.storage;
		setEditedAddons(edited);
	}, [addons?.users, addons?.storage]);

	useEffect(() => {
		if (!showConfirmModal === false) {
			setEditedAddons(false);
			refreshAccountContext();
		}
	}, [showConfirmModal]);

	//When selecting a different plan, set edited to false and set back initial addon quantities
	useEffect(() => {
		setEditedAddons(false);
		setAddons({
			users: currentPlan ? stripeAddons.users : 0,
			storage: currentPlan ? stripeAddons.storage : 0
		});
	}, [plan, selectedPlan]);

	const handleIncrement = key => {
		setAddons(prev => ({
			...prev,
			[key]: prev[key] + 1
		}));
	};

	const handleDecrement = key => {
		setAddons(prev => ({
			...prev,
			[key]: prev[key] > 0 ? prev[key] - 1 : 0
		}));
	};

	const renderAddons = addons => {
		return (
			<div
				className={`space-y-2 opacity-0 overflow-hidden transition-all ${selectedPlan === plan ? 'opacity-100' : 'opacity-0'}`}
			>
				{usersAddon === true && (
					<div className='flex flex-row justify-between w-full'>
						<button
							onClick={() => handleDecrement('users')}
							className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'
						>
							-
						</button>
						<span>Extra Team Members: {addons.users || 0}</span>
						<button
							onClick={() => handleIncrement('users')}
							className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'
						>
							+
						</button>
					</div>
				)}
				{storageAddon === true && (
					<div className='flex flex-row justify-between w-full'>
						<button
							onClick={() => handleDecrement('storage')}
							className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'
						>
							-
						</button>
						<span>Extra GB Vector Storage: {addons.storage || 0}</span>
						<button
							onClick={() => handleIncrement('storage')}
							className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'
						>
							+
						</button>
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			className={cn(
				`transition-all cursor-pointer w-max min-w-[300px] rounded-lg p-4 border`,
				selectedPlan === plan
					? 'shadow-lg bg-blue-100 border-blue-400 dark:bg-blue-900 border-1'
					: 'border hover:shadow-md bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:bg-slate-700'
			)}
			onClick={() => setSelectedPlan(plan)}
		>
			{!currentPlan && isPopular && (
				<span className='px-2 py-[0.5px] bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm rounded-lg'>
					Most popular
				</span>
			)}
			{currentPlan && (
				<div className='flex items-center'>
					{stripeTrial && (
						<span className='px-2 py-[0.5px] me-2 bg-white text-orange-800 border border-orange-800 text-sm rounded-lg'>
							Trial
						</span>
					)}
					{price > 0 ? (
						<span
							suppressHydrationWarning
							className={`text-sm px-2 py-[0.5px] me-2 bg-white text-${stripeCancelled ? 'orange-700' : 'green-800'} border border-${stripeCancelled ? 'orange-800' : 'green-800'} text-sm rounded-lg`}
						>
							{stripeCancelled === true ? 'Ends' : 'Renews'} {new Date(stripeEndsAt).toDateString()}
						</span>
					) : (
						<span className='px-2 py-[0.5px] me-2 bg-white text-blue-800 border border-blue-800 text-sm rounded-lg'>
							Current Plan
						</span>
					)}
				</div>
			)}
			<div className='flex justify-center align-middle mt-4'>
				<img
					className='rounded-md w-24 h-24 lg:w-48 lg:h-48'
					src={`/images/agentcloud-mark-white-bg-black-${plan}.png`}
				/>
			</div>
			<div className='flex items-center mt-4'>
				<h2 className='text-lg font-semibold dark:text-white'>{title}</h2>
			</div>
			<div className='mt-1 min-h-[80px] dark:text-white'>
				{description}
				{price > 0 && //and not free plan
					plan !== SubscriptionPlan.ENTERPRISE && //and not customisable on enterprise
					renderAddons(addons)}
			</div>
			<div className='mt-4 flex flex-row dark:text-white'>
				<span className='text-4xl font-bold'>${isEnterprise ? 'Custom' : price}</span>
				{!isEnterprise && (
					<span className='text-sm text-gray-500 flex flex-col ps-1 dark:text-gray-50'>
						<span>per</span>
						<span>month</span>
					</span>
				)}
			</div>
			{link ? (
				<Link
					className='block text-center w-full bg-indigo-600 text-white px-4 py-2 font-semibold rounded-md mt-2'
					href={link}
					rel='noopener noreferrer'
					target='_blank'
				>
					Contact us
				</Link>
			) : (
				<button
					onClick={async () => {
						setSelectedPlan(plan);
						if (currentPlan && !editedAddons && !stripeCancelled) {
							API.getPortalLink(
								{
									_csrf: csrf
								},
								null,
								toast.error,
								router
							);
						} else {
							setSubmitting(true);
							const payload = {
								_csrf: csrf,
								plan,
								...(usersAddon ? { users: addons.users } : {}),
								...(storageAddon ? { storage: addons.storage } : {})
							};
							await API.requestChangePlan(
								payload,
								res => {
									if (res && res?.checkoutSession) {
										setStagedChange(res?.checkoutSession);
									}
								},
								toast.error,
								router
							);
							setTimeout(() => setSubmitting(false), 500);
						}
					}}
					// disabled={(selectedPlan !== plan) || submitting || (currentPlan && !editedAddons && (!stripeCancelled || price === 0))}
					className={classNames(
						editedAddons || (!currentPlan && selectedPlan === plan)
							? 'mt-4 transition-colors flex w-full justify-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-gray-600'
							: 'mt-4 transition-colors flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-600'
					)}
				>
					{submitting && <ButtonSpinner className='mt-1 me-2' />}
					{submitting
						? 'Loading...'
						: currentPlan
							? stripeCancelled && price > 0
								? 'Resubscribe'
								: 'Update Subscription'
							: 'Change Plan'}
				</button>
			)}
		</div>
	);
}
